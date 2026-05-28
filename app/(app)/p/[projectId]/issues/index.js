// feat(screens/issues/IssuesPage): search, filter and bulk-edit a project's issues, with saved filters and quick create.
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Highlight from '@/components/ui/Highlight';
import { Icon } from '@/components/ui/Icon';
import Skeleton from '@/components/ui/Skeleton';
import JerryButton from '@/components/ai/JerryButton';
import { useProject } from '@/context/ProjectContext';
import { useShell } from '@/context/ShellContext';
import { useToast } from '@/context/ToastContext';
import { listSprints } from '@/libs/api/boards';
import { deleteIssue, listIssues } from '@/libs/api/issues';
import { summary } from '@/libs/api/reports';
import { searchUsers } from '@/libs/api/users';
import { emptyCopy } from '@/metadata/empty';
import { relativeTime } from '@/utils/format';
import { priorityIcon, priorityTone, statusTone, typeIcon } from '@/utils/issueVisuals';
import { useResource } from '@/utils/useResource';
import { usePaged } from '@/utils/usePaged';
import BulkBar from '@/components/issues/BulkBar';
import SavedFiltersPanel from '@/components/issues/SavedFiltersPanel';
import { Chip, MoreButton, OptionSheet, SelectField, Sheet, SheetButton, confirmThen } from '@/components/issues/sheets';

const FILTER_KEYS = ['q', 'status', 'assignee', 'type', 'label', 'sprint', 'savedFilter'];
const STATUS_CHIPS = [
  { value: 'todo', label: 'To do' },
  { value: 'inprogress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];
const SORT_VALUE = {
  key: (r) => r.number ?? 0,
  title: (r) => String(r.title ?? '').toLowerCase(),
  status: (r) => String(r.statusName ?? ''),
  priority: (r) => r.priorityRank ?? 99,
  updated: (r) => new Date(r.lastActivityAt ?? r.updatedAt ?? 0).getTime(),
};
const SORT_OPTIONS = [
  { value: '', label: 'Default order' },
  { value: 'updated:desc', label: 'Recently updated' },
  { value: 'updated:asc', label: 'Least recently updated' },
  { value: 'key:asc', label: 'Key, ascending' },
  { value: 'key:desc', label: 'Key, descending' },
  { value: 'title:asc', label: 'Title, A to Z' },
  { value: 'title:desc', label: 'Title, Z to A' },
  { value: 'status:asc', label: 'Status' },
  { value: 'priority:asc', label: 'Priority, highest first' },
  { value: 'priority:desc', label: 'Priority, lowest first' },
];

const idOf = (r) => String(r.id ?? r._id);
const withId = (r) => ({ ...r, id: idOf(r) });
const assigneeOf = (r) => r.assigneeUser ?? r.assignee ?? null;
const one = (v) => (Array.isArray(v) ? v[0] : v) ?? '';

function StatTile({ icon, value, label }) {
  return (
    <View className="flex-1 bg-surface border border-border rounded-[14px] p-[12px] gap-[4px]">
      <Icon name={icon} size={16} />
      <Text className="text-foreground text-[20px] font-bold" style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
      <Text className="text-muted text-[12px]">{label}</Text>
    </View>
  );
}

export default function IssuesPage() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const { projectId, types, labels, statuses, can } = useProject();
  const { openCreateIssue } = useShell();
  const toast = useToast();
  const [sort, setSort] = useState(null);
  const [selected, setSelected] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const userNames = useRef({});

  const q = one(searchParams.q);
  const status = one(searchParams.status);
  const assignee = one(searchParams.assignee);
  const type = one(searchParams.type);
  const label = one(searchParams.label);
  const sprint = one(searchParams.sprint);
  const savedFilter = one(searchParams.savedFilter);
  const activeStatuses = status ? status.split(',') : [];
  const current = { q, status, assignee, type, label, sprint, savedFilter };
  const hasFilters = FILTER_KEYS.some((k) => current[k]);

  // Filters live in the route params, as the web keeps them in the URL.
  const setParams = (changes) => {
    const next = {};
    Object.entries(changes).forEach(([k, v]) => {
      next[k] = v ? String(v) : undefined;
    });
    router.setParams(next);
  };
  // Any manual filter change leaves the saved filter behind.
  const setFilter = (changes) => setParams({ ...changes, savedFilter: null });
  const clearFilters = () => {
    setDraftQ('');
    setParams(Object.fromEntries(FILTER_KEYS.map((k) => [k, null])));
  };

  // Search is debounced 250ms before it reaches the params and the request.
  const [draftQ, setDraftQ] = useState(q);
  useEffect(() => {
    setDraftQ(q);
  }, [q]);
  useEffect(() => {
    if (draftQ.trim() === q) return undefined;
    const id = setTimeout(() => setFilter({ q: draftQ.trim() }), 250);
    return () => clearTimeout(id);
    // Only the typed text drives the debounce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftQ]);

  const params = useMemo(
    () => ({
      ...(q ? { q } : {}),
      ...(status ? { status } : {}),
      ...(assignee ? { assignee } : {}),
      ...(type ? { type } : {}),
      ...(label ? { label } : {}),
      ...(sprint ? { sprint } : {}),
      ...(savedFilter ? { savedFilter } : {}),
    }),
    [q, status, assignee, type, label, sprint, savedFilter],
  );
  const issues = usePaged((p) => listIssues(projectId, p), params);
  const rows = useMemo(() => issues.items.map(withId), [issues.items]);

  const stats = useResource(() => summary(projectId), [projectId]);
  const sprints = useResource(() => listSprints(projectId, { limit: 100 }), [projectId]);
  const counts = useMemo(() => {
    const byStatus = stats.data?.byStatus ?? {};
    const sumOf = (category) =>
      statuses.filter((s) => s.category === category).reduce((total, s) => total + (byStatus[s.name] ?? 0), 0);
    return { todo: sumOf('todo'), inprogress: sumOf('inprogress'), done: sumOf('done') };
  }, [stats.data, statuses]);

  const displayRows = useMemo(() => {
    if (!sort) return rows;
    const get = SORT_VALUE[sort.key] ?? SORT_VALUE.updated;
    const list = [...rows];
    list.sort((a, b) => {
      const x = get(a);
      const y = get(b);
      const c = x < y ? -1 : x > y ? 1 : 0;
      return sort.dir === 'asc' ? c : -c;
    });
    return list;
  }, [rows, sort]);

  const visibleIds = useMemo(() => new Set(rows.map(idOf)), [rows]);
  const liveSelected = selected.filter((id) => visibleIds.has(id));
  const selecting = liveSelected.length > 0 && can('issue.bulk');

  const toggleSelect = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const onBulkChanged = () => {
    setSelected([]);
    issues.reload();
    stats.reload();
  };

  const issuePath = (key) => `/p/${encodeURIComponent(String(projectId))}/issues/${encodeURIComponent(String(key))}`;

  const copyLink = async (row) => {
    try {
      await Clipboard.setStringAsync(Linking.createURL(issuePath(row.key)));
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  const askDelete = (row) =>
    confirmThen(
      { title: `Delete ${row.key ?? 'issue'}?`, text: 'Deleted issues cannot be restored.', confirmLabel: 'Delete', tone: 'danger' },
      async () => {
        try {
          await deleteIssue(projectId, idOf(row));
          issues.setItems((prev) => prev.filter((r) => idOf(r) !== idOf(row)));
          toast.success(`Deleted ${row.key}`);
          stats.reload();
        } catch (err) {
          toast.error(err.message ?? 'Could not delete the issue');
        }
      },
    );

  const applySavedFilter = (filter) => {
    setDraftQ('');
    setParams({ ...Object.fromEntries(FILTER_KEYS.map((k) => [k, null])), savedFilter: idOf(filter) });
    setPanelOpen(false);
  };

  // Saved filter grammar: "field = value" joined by AND. Only one status category can be saved.
  const savedQuery = useMemo(() => {
    const clauses = [];
    if (activeStatuses.length === 1) clauses.push(`category = ${activeStatuses[0]}`);
    if (assignee) clauses.push(`assignee = ${assignee}`);
    const typeName = types.find((t) => idOf(t) === type)?.name;
    if (typeName) clauses.push(`type = "${typeName}"`);
    if (label) clauses.push(`label = "${label}"`);
    if (sprint) clauses.push(`sprint = ${sprint}`);
    return clauses.join(' AND ');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, assignee, type, label, sprint, types]);

  const toggleStatus = (value) => {
    const next = activeStatuses.includes(value) ? activeStatuses.filter((s) => s !== value) : [...activeStatuses, value];
    setFilter({ status: next.join(',') || null });
  };

  const loadUsers = async (text) => {
    const res = await searchUsers(text);
    return (res.data ?? []).map((u) => {
      userNames.current[idOf(u)] = u.displayName;
      return { value: idOf(u), label: u.displayName };
    });
  };

  const rowMenu = (row) => [
    { id: 'open', label: 'Open', icon: 'external', onSelect: () => router.push(issuePath(row.key)) },
    { id: 'copy', label: 'Copy link', icon: 'copy', onSelect: () => copyLink(row) },
    ...(can('issue.bulk') ? [{ id: 'select', label: 'Select', icon: 'check', onSelect: () => toggleSelect(row.id) }] : []),
    ...(can('issue.delete')
      ? ['separator', { id: 'delete', label: 'Delete', icon: 'trash', danger: true, onSelect: () => askDelete(row) }]
      : []),
  ];

  const newIssue = () => openCreateIssue({});
  const extraFilters = [type, assignee && assignee !== 'me' ? assignee : '', label, sprint].filter(Boolean).length;

  const typeOptions = [{ value: '', label: 'All types' }, ...types.map((t) => ({ value: idOf(t), label: t.name }))];
  const labelOptions = [{ value: '', label: 'All labels' }, ...labels.map((l) => ({ value: l.name, label: l.name }))];
  const sprintOptions = [
    { value: '', label: 'All sprints' },
    ...(sprints.data ?? []).filter((s) => s.state !== 'closed').map((s) => ({ value: idOf(s), label: s.name })),
  ];

  let empty = null;
  if (issues.status === 'loading') empty = <Skeleton variant="rows" count={6} />;
  else if (issues.status === 'error')
    empty = <EmptyState tone="error" title={issues.error?.message ?? 'Could not load issues'} onRetry={issues.reload} />;
  else if (hasFilters)
    empty = (
      <EmptyState
        {...emptyCopy('issues')}
        action={
          <Button variant="ghost" size="sm" onClick={clearFilters} onPress={clearFilters}>
            Clear filters
          </Button>
        }
      />
    );
  else
    empty = (
      <EmptyState
        icon="task"
        title="No issues yet"
        text="Create the first issue for this project."
        action={
          can('issue.create') ? (
            <Button variant="ember" size="sm" icon="plus" onClick={newIssue} onPress={newIssue}>
              New issue
            </Button>
          ) : null
        }
      />
    );

  const header = (
    <View className="gap-[14px] mb-[12px]">
      <View className="flex-row items-start gap-[10px]">
        <View className="flex-1">
          <Text className="text-foreground text-[26px] font-bold">Issues</Text>
          <Text className="text-muted text-[13.5px]">Search, filter and bulk-edit the work in this project.</Text>
        </View>
        {can('issue.create') ? (
          <Button variant="ember" size="sm" icon="plus" onClick={newIssue} onPress={newIssue}>
            New issue
          </Button>
        ) : null}
      </View>

      <View className="flex-row gap-[8px]">
        <StatTile icon="stTodo" value={counts.todo} label="To do" />
        <StatTile icon="stProgress" value={counts.inprogress} label="In progress" />
        <StatTile icon="stDone" value={counts.done} label="Done" />
      </View>

      <View className="flex-row items-center gap-[8px]">
        <View className="flex-1 flex-row items-center gap-[8px] border border-border rounded-[12px] bg-surface px-[12px]">
          <Icon name="search" size={16} />
          <TextInput
            value={draftQ}
            onChangeText={setDraftQ}
            placeholder="Search issues"
            accessibilityLabel="Search issues"
            returnKeyType="search"
            autoCorrect={false}
            className="flex-1 py-[10px] text-[15px] text-foreground"
            placeholderTextColorClassName="accent-muted"
          />
        </View>
        <JerryButton mode="search" projectId={projectId} onApply={(out) => setDraftQ(out.query ?? '')} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-[8px]">
        {STATUS_CHIPS.map((c) => (
          <Chip key={c.value} pressed={activeStatuses.includes(c.value)} onPress={() => toggleStatus(c.value)}>
            {c.label}
          </Chip>
        ))}
        <Chip pressed={assignee === 'me'} icon="user" onPress={() => setFilter({ assignee: assignee === 'me' ? null : 'me' })}>
          Mine
        </Chip>
        <Chip pressed={extraFilters > 0} icon="filter" onPress={() => setFiltersOpen(true)}>
          {extraFilters ? `Filters ${extraFilters}` : 'Filters'}
        </Chip>
        <Chip pressed={Boolean(sort)} icon="sort" onPress={() => setSortOpen(true)}>
          Sort
        </Chip>
        <Chip pressed={Boolean(savedFilter)} icon="savedFilter" onPress={() => setPanelOpen(true)}>
          Saved filters
        </Chip>
        {hasFilters ? <Chip onPress={clearFilters}>Clear filters</Chip> : null}
      </ScrollView>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={issues.status === 'success' ? displayRows : []}
        keyExtractor={(r) => r.id}
        contentContainerClassName="p-[16px]"
        contentContainerStyle={{ paddingBottom: selecting ? 150 : 40 }}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View className="h-[8px]" />}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              issues.reload();
              stats.reload();
            }}
          />
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (issues.hasMore && !issues.loadingMore) issues.loadMore();
        }}
        ListFooterComponent={issues.loadingMore ? <ActivityIndicator className="mt-[16px]" /> : null}
        renderItem={({ item: r }) => {
          const a = assigneeOf(r);
          const isSel = liveSelected.includes(r.id);
          return (
            <Pressable
              onPress={() => (selecting ? toggleSelect(r.id) : router.push(issuePath(r.key)))}
              onLongPress={can('issue.bulk') ? () => toggleSelect(r.id) : undefined}
              accessibilityRole="button"
              accessibilityState={{ selected: isSel }}
              className={`bg-surface border rounded-[14px] p-[12px] gap-[8px] active:opacity-80 ${
                isSel ? 'border-accent' : 'border-border'
              }`}
            >
              <View className="flex-row items-center gap-[8px]">
                {selecting ? (
                  <View
                    className={`w-[20px] h-[20px] rounded-[6px] border items-center justify-center ${
                      isSel ? 'bg-accent border-accent' : 'border-border'
                    }`}
                  >
                    {isSel ? <Icon name="check" size={13} cls="text-on-accent" /> : null}
                  </View>
                ) : null}
                <Icon name={typeIcon({ icon: r.typeIcon, name: r.typeName, hierarchy: r.hierarchy })} size={15} />
                <Text className="text-muted text-[12.5px] font-bold" style={{ fontVariant: ['tabular-nums'] }}>
                  {r.key}
                </Text>
                <Text numberOfLines={1} className="flex-1 text-muted text-[12px]">
                  {r.typeName}
                </Text>
                <Text className="text-muted text-[12px]">{relativeTime(r.lastActivityAt ?? r.updatedAt)}</Text>
                {!selecting ? <MoreButton label={`Actions for ${r.key}`} items={rowMenu(r)} /> : null}
              </View>
              <Text numberOfLines={2} className="text-foreground font-semibold text-[15px]">
                <Highlight text={r.title} query={q} />
              </Text>
              <View className="flex-row flex-wrap items-center gap-[8px]">
                <Badge variant="status" tone={statusTone(r.statusCategory)}>
                  {r.statusName}
                </Badge>
                <Badge variant="badge" tone={priorityTone(r.priorityRank)} icon={priorityIcon(r.priorityRank, r.priorityIcon)}>
                  {r.priorityName ?? 'None'}
                </Badge>
                <View className="flex-1" />
                {a ? (
                  <View className="flex-row items-center gap-[6px] max-w-[50%]">
                    <Avatar name={a.displayName ?? 'User'} src={a.avatar} size="xs" />
                    <Text numberOfLines={1} className="text-foreground text-[12.5px]">
                      {a.displayName}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-muted text-[12.5px]">Unassigned</Text>
                )}
              </View>
            </Pressable>
          );
        }}
      />

      {selecting ? <BulkBar ids={liveSelected} onClear={() => setSelected([])} onChanged={onBulkChanged} /> : null}

      <Sheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        footer={
          <>
            {hasFilters ? (
              <SheetButton
                label="Clear filters"
                onPress={() => {
                  clearFilters();
                  setFiltersOpen(false);
                }}
              />
            ) : null}
            <SheetButton variant="ember" label="Done" onPress={() => setFiltersOpen(false)} />
          </>
        }
      >
        <SelectField
          label="Type"
          placeholder="All types"
          value={type}
          options={typeOptions}
          onChange={(v) => setFilter({ type: v || null })}
        />
        <SelectField
          label="Assignee"
          placeholder="Anyone"
          value={assignee && assignee !== 'me' ? assignee : null}
          valueLabel={assignee && assignee !== 'me' ? userNames.current[assignee] ?? 'Selected person' : undefined}
          loadOptions={loadUsers}
          clearLabel="Anyone"
          onChange={(v) => setFilter({ assignee: v || null })}
        />
        <SelectField
          label="Label"
          placeholder="All labels"
          value={label}
          options={labelOptions}
          onChange={(v) => setFilter({ label: v || null })}
        />
        <SelectField
          label="Sprint"
          placeholder="All sprints"
          value={sprint}
          options={sprintOptions}
          onChange={(v) => setFilter({ sprint: v || null })}
        />
      </Sheet>

      <OptionSheet
        open={sortOpen}
        onClose={() => setSortOpen(false)}
        title="Sort issues"
        options={SORT_OPTIONS}
        value={sort ? `${sort.key}:${sort.dir}` : ''}
        onChange={(v) => {
          if (!v) return setSort(null);
          const [key, dir] = v.split(':');
          setSort({ key, dir });
        }}
      />

      <SavedFiltersPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        query={savedQuery}
        activeId={savedFilter}
        onApply={applySavedFilter}
        onDeleted={() => setParams({ savedFilter: null })}
      />
    </View>
  );
}
