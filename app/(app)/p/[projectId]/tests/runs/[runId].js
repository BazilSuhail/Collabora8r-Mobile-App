// feat(screens/tests/TestRunPage): execute a test run case by case, record pass, fail or blocked, and complete it.
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import PageHead from '@/components/layout/PageHead';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';
import { useProject } from '@/context/ProjectContext';
import { useToast } from '@/context/ToastContext';
import { completeTestRun, getTestRun, listResults, listTestCases, upsertResult } from '@/libs/api/tests';
import { paths } from '@/routes/paths';
import { useResource } from '@/utils/useResource';
import { usePaged } from '@/utils/usePaged';

const withIds = (res) => ({ ...res, data: res.data.map((r) => ({ ...r, id: r.id ?? r._id })) });
const fetchCases = ({ pid, ...p }) => listTestCases(pid, p).then(withIds);
const fetchResults = ({ pid, runId, ...p }) => listResults(pid, runId, p).then(withIds);
const textOf = (e) => (typeof e === 'string' ? e : (e?.target?.value ?? e?.nativeEvent?.text ?? ''));

const CARD = 'bg-surface border border-border rounded-card p-4';

const OUTCOMES = [
  { value: 'passed', label: 'Pass', on: 'bg-spruce-soft border-transparent', onText: 'text-spruce-t' },
  { value: 'failed', label: 'Fail', on: 'bg-ember-soft border-transparent', onText: 'text-ember-t' },
  { value: 'blocked', label: 'Blocked', on: 'bg-saffron-soft border-transparent', onText: 'text-saffron-t' },
];

const upsertLocal = (list, row) => {
  const i = list.findIndex((r) => r.caseId === row.caseId);
  if (i === -1) return [row, ...list];
  const next = [...list];
  next[i] = row;
  return next;
};

export default function TestRunPage() {
  const { runId } = useLocalSearchParams();
  const router = useRouter();
  const { projectId, can } = useProject();
  const toast = useToast();
  const canEdit = can('test.edit');
  const run = useResource(() => getTestRun(projectId, runId), [projectId, runId]);
  const cases = usePaged(fetchCases, { pid: projectId });
  const results = usePaged(fetchResults, { pid: projectId, runId });
  const [notes, setNotes] = useState({});
  const [pendingCase, setPendingCase] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const locked = !canEdit || run.data?.status === 'completed';

  const resultByCase = useMemo(() => new Map(results.items.map((r) => [r.caseId, r])), [results.items]);
  const noteFor = (caseId) => notes[caseId] ?? resultByCase.get(caseId)?.notes ?? '';

  const record = async (testCase, outcome) => {
    const previous = resultByCase.get(testCase.id);
    const body = { caseId: testCase.id, status: outcome, notes: noteFor(testCase.id) };
    setPendingCase(testCase.id);
    results.setItems((list) => upsertLocal(list, { ...body, id: previous?.id ?? `pending-${testCase.id}` }));
    try {
      const saved = await upsertResult(projectId, runId, body);
      results.setItems((list) => upsertLocal(list, { ...saved.data, caseId: testCase.id }));
    } catch {
      results.setItems((list) => (previous ? upsertLocal(list, previous) : list.filter((r) => r.caseId !== testCase.id)));
    } finally {
      setPendingCase(null);
    }
  };

  const saveNote = (testCase) => {
    const existing = resultByCase.get(testCase.id);
    if (!existing || locked) return;
    const typed = notes[testCase.id];
    if (typed === undefined || typed === existing.notes) return;
    record(testCase, existing.status);
  };

  const tally = useMemo(() => {
    const t = { passed: 0, failed: 0, blocked: 0 };
    cases.items.forEach((c) => {
      const s = resultByCase.get(c.id)?.status;
      if (s && t[s] !== undefined) t[s] += 1;
    });
    return t;
  }, [cases.items, resultByCase]);

  const total = cases.items.length;
  const tested = tally.passed + tally.failed + tally.blocked;
  const passPct = total ? Math.round((tally.passed / total) * 100) : 0;

  const complete = async () => {
    try {
      const done = await completeTestRun(projectId, runId);
      const c = done.data?.counts ?? {};
      toast.success(`Run completed: ${c.passed ?? tally.passed} passed, ${c.failed ?? tally.failed} failed`);
      setConfirmOpen(false);
      run.reload();
    } catch {
      // The API layer shows the failure. The dialog stays open so the user can retry.
    }
  };

  const backToCases = () => (router.canGoBack() ? router.back() : router.replace(paths.tests(projectId)));

  if (run.status === 'error') {
    return (
      <View className="flex-1 bg-background p-4 gap-4">
        <PageHead title="Test run" sub="The run did not load." />
        <View className={CARD}>
          <EmptyState tone="error" title="This run did not load" text="Check the link and try again." onRetry={run.reload} />
        </View>
      </View>
    );
  }

  const runData = run.data ?? {};
  const loading = cases.status === 'loading' || results.status === 'loading';

  const header = (
    <View className="gap-4 mb-1">
      <PageHead
        title={runData.name ?? 'Test run'}
        sub={`${runData.environment || 'No environment'} · Build ${runData.buildVersion || 'not set'}`}
        actions={
          <>
            <Button variant="ghost" icon="chevL" onClick={backToCases}>
              Test cases
            </Button>
            {canEdit && runData.status !== 'completed' ? (
              <Button variant="ember" icon="check" onClick={() => setConfirmOpen(true)}>
                Complete run
              </Button>
            ) : null}
          </>
        }
      />

      <View className={`${CARD} gap-3`} accessibilityLabel="Run totals">
        <View className="flex-row flex-wrap items-center gap-[10px]">
          <Badge
            variant="status"
            tone={runData.status === 'completed' ? 'spruce' : runData.status === 'inProgress' ? 'iris' : 'plain'}
          >
            {runData.status === 'completed' ? 'Completed' : runData.status === 'inProgress' ? 'In progress' : 'Planned'}
          </Badge>
          <Text className="text-muted text-[13px]">
            {tally.passed} passed · {tally.failed} failed · {tally.blocked} blocked · {Math.max(total - tested, 0)} untested
          </Text>
        </View>
        <View
          accessibilityRole="image"
          accessibilityLabel={`${passPct} percent of cases passed`}
          className="h-[8px] rounded-full bg-well overflow-hidden"
        >
          <View className="h-full rounded-full bg-spruce" style={{ width: `${passPct}%` }} />
        </View>
      </View>
    </View>
  );

  let empty = null;
  if (loading) {
    empty = <Skeleton variant="feed" count={5} />;
  } else if (cases.status === 'error') {
    empty = (
      <View className={CARD}>
        <EmptyState tone="error" title="Test cases did not load" text="Try again in a moment." onRetry={cases.reload} />
      </View>
    );
  } else {
    empty = (
      <View className={CARD}>
        <EmptyState icon="test" title="This run has no cases" text="Add test cases to the project before recording results." />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        className="flex-1"
        contentContainerClassName="p-4 gap-[10px]"
        keyboardShouldPersistTaps="handled"
        data={loading || cases.status === 'error' ? [] : cases.items}
        keyExtractor={(c) => String(c.id)}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        onEndReached={() => cases.hasMore && !cases.loadingMore && cases.loadMore()}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          cases.hasMore ? (
            <View className="py-4 items-center">
              {cases.loadingMore ? (
                <ActivityIndicator />
              ) : (
                <Button variant="soft" size="sm" onClick={cases.loadMore}>
                  Show more
                </Button>
              )}
            </View>
          ) : (
            <View className="h-10" />
          )
        }
        renderItem={({ item: c }) => {
          const current = resultByCase.get(c.id)?.status;
          const busy = pendingCase === c.id;
          return (
            <View className="bg-surface border border-border rounded-card p-[14px] gap-[10px]">
              <View className="gap-[2px]">
                <Text className="text-muted text-[12px] font-semibold">{c.key}</Text>
                <Text className="font-semibold text-foreground">{c.title}</Text>
              </View>
              <View accessibilityRole="radiogroup" accessibilityLabel={`Result for ${c.title}`} className="flex-row gap-[6px]">
                {OUTCOMES.map((o) => {
                  const on = current === o.value;
                  const disabled = locked || busy;
                  return (
                    <Pressable
                      key={o.value}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: on, disabled }}
                      disabled={disabled}
                      onPress={() => record(c, o.value)}
                      className={`flex-1 min-h-[44px] items-center justify-center rounded-ctl border active:opacity-70 ${
                        on ? o.on : 'border-line-2 bg-surface'
                      } ${disabled ? 'opacity-[0.45]' : ''}`}
                    >
                      <Text className={`font-semibold text-[13px] ${on ? o.onText : 'text-muted'}`}>{o.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {c.steps?.length ? (
                <View className="gap-1">
                  {c.steps.map((s, i) => (
                    <Text key={i} className="text-[13.5px] text-muted">
                      {i + 1}. {s.action}
                      {s.expected ? <Text className="text-faint"> → {s.expected}</Text> : null}
                    </Text>
                  ))}
                </View>
              ) : null}
              <Input
                label={`Note for ${c.title}`}
                hideLabel
                placeholder="Note (optional)"
                value={noteFor(c.id)}
                editable={!(locked || busy)}
                disabled={locked || busy}
                onChange={(e) => setNotes((n) => ({ ...n, [c.id]: textOf(e) }))}
                onBlur={() => saveNote(c)}
                returnKeyType="done"
              />
            </View>
          );
        }}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Complete this run?"
        text="Cases without a result stay untested. Recorded results are kept."
        confirmLabel="Complete run"
        tone="default"
        onConfirm={complete}
      />
    </KeyboardAvoidingView>
  );
}
