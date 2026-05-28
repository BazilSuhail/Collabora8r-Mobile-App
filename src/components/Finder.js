import { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import { Icon } from '@/components/ui/Icon';
import { useThemeColors } from '@/components/layout/useThemeColors';
import { FINDER_STATIC } from '@/metadata/finder';
import { paths } from '@/routes/paths';
import { listIssues } from '@/libs/api/issues';
import { searchUsers } from '@/libs/api/users';

const EMPTY = { issues: [], users: [] };
const KIND_ICON = { Page: 'chevR', Action: 'plus', Issue: 'task', Person: 'user' };
const SEARCH_DEBOUNCE_MS = 250;
const MAX_RESULTS = 14;

// Label with the matched part in bold (the client's Highlight).
function Marked({ text = '', query = '' }) {
  const at = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <Text className="text-accent">{text.slice(at, at + query.length)}</Text>
      {text.slice(at + query.length)}
    </>
  );
}

// Global search: static pages and actions, plus issues in the current project and people.
// Full-screen sheet opened from the header search button (Ctrl/Cmd+K on web).
export default function Finder({ open, onClose, pid, onNewIssue }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [q, setQ] = useState('');
  const [remote, setRemote] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const needle = q.trim();
  const needleLower = needle.toLowerCase();

  useEffect(() => {
    if (open) {
      setQ('');
      setRemote(EMPTY);
    }
  }, [open]);

  // Remote search, debounced. Needs two characters so a single letter does not query.
  useEffect(() => {
    if (!open || needle.length < 2) {
      setRemote(EMPTY);
      setBusy(false);
      return undefined;
    }
    let alive = true;
    setBusy(true);
    const timer = setTimeout(async () => {
      try {
        const [issues, users] = await Promise.all([
          pid ? listIssues(pid, { q: needle, limit: 5 }) : Promise.resolve({ data: [] }),
          searchUsers(needle),
        ]);
        if (alive) setRemote({ issues: issues.data ?? [], users: users.data ?? [] });
      } catch {
        if (alive) setRemote(EMPTY);
      } finally {
        if (alive) setBusy(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [needle, open, pid]);

  const results = useMemo(() => {
    const statics = FINDER_STATIC.filter((e) => e.action !== 'new-issue' || pid)
      .filter((e) => !needleLower || `${e.label} ${e.keywords}`.toLowerCase().includes(needleLower))
      .map((e) => ({
        id: e.id,
        kind: e.kind,
        label: e.label,
        meta: e.kind === 'Action' ? 'New issue' : e.to ? e.to() : '',
        action: e.action ?? null,
        href: e.to ? e.to() : null,
      }));
    const issues = remote.issues.map((i) => ({
      id: `issue-${i.id ?? i._id ?? i.key}`,
      kind: 'Issue',
      label: i.summary ?? i.key,
      meta: i.key ?? '',
      action: null,
      href: pid && i.key ? paths.issue(pid, i.key) : null,
    }));
    const users = remote.users.map((u) => ({
      id: `user-${u.id ?? u._id ?? u.displayName}`,
      kind: 'Person',
      label: u.displayName ?? u.email ?? '',
      meta: u.email ?? '',
      action: null,
      href: pid ? paths.projectPeople(pid) : null,
    }));
    return [...statics, ...issues, ...users].slice(0, MAX_RESULTS);
  }, [needleLower, pid, remote]);

  const pick = (entry) => {
    if (!entry) return;
    if (entry.action === 'new-issue') {
      onClose();
      onNewIssue?.();
      return;
    }
    if (!entry.href) return;
    onClose();
    router.push(entry.href);
  };

  return (
    <Modal visible={Boolean(open)} animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen">
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center gap-[10px] px-[16px] py-[10px] border-b border-border">
          <Icon name="search" size={18} color={colors.muted} />
          <TextInput
            className="flex-1 min-w-0 text-[17px] text-foreground py-[8px]"
            placeholder="Search pages, issues and people"
            placeholderTextColor={colors.faint ?? colors.muted}
            accessibilityLabel="Search Collabor8r"
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            value={q}
            onChangeText={setQ}
            onSubmitEditing={() => pick(results[0])}
          />
          {busy ? <Spinner size="sm" label="Searching" /> : null}
          <Pressable onPress={onClose} accessibilityRole="button" hitSlop={8} className="min-h-[44px] justify-center px-[4px]">
            <Text className="text-[15px] font-semibold text-accent">Cancel</Text>
          </Pressable>
        </View>

        {results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={(e) => e.id}
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="p-[8px]"
            contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
            renderItem={({ item: e }) => {
              const disabled = !(e.href || e.action);
              return (
                <Pressable
                  onPress={() => pick(e)}
                  disabled={disabled}
                  accessibilityRole="button"
                  className={`flex-row items-center gap-[12px] rounded-[12px] py-[10px] px-[12px] active:bg-well ${disabled ? 'opacity-45' : ''}`}
                >
                  <View className="w-[30px] h-[30px] rounded-[9px] bg-well items-center justify-center">
                    <Icon name={KIND_ICON[e.kind] ?? 'chevR'} size={15} color={colors.muted} />
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text numberOfLines={1} className="text-[15px] font-semibold text-foreground">
                      <Marked text={e.label} query={needle} />
                    </Text>
                    <Text numberOfLines={1} className="text-[12px] text-muted">
                      {e.kind}
                      {e.meta ? ` · ${e.meta}` : ''}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
          />
        ) : busy ? (
          <Text className="mt-[12px] px-[16px] text-[13px] text-muted" accessibilityLiveRegion="polite">
            Searching
          </Text>
        ) : (
          <EmptyState icon="search" title="No matches" text="Try another word, or a key such as PROJ-42." />
        )}
      </View>
    </Modal>
  );
}
