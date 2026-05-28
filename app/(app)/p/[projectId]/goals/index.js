// feat(screens/goals/GoalsPage): set project goals, record progress and watch each goal's gauge fill.
import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, View } from 'react-native';
import PageHead from '@/components/layout/PageHead';
import GoalCard, { GOAL_STATUS } from '@/components/goals/GoalCard';
import GoalFormModal from '@/components/goals/GoalFormModal';
import ProgressModal from '@/components/goals/ProgressModal';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import { useProject } from '@/context/ProjectContext';
import { useToast } from '@/context/ToastContext';
import { usePaged } from '@/utils/usePaged';
import { listGoals, deleteGoal } from '@/libs/api/reports';
import { Chip, confirmAlert } from '@/components/issues/sheets';

const keyOf = (row) => String(row.id ?? row._id);

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'on_track', label: 'On track' },
  { value: 'at_risk', label: 'At risk' },
  { value: 'off_track', label: 'Off track' },
  { value: 'done', label: 'Done' },
];

export default function GoalsPage() {
  const { projectId, can } = useProject();
  const toast = useToast();
  const [filter, setFilter] = useState('all');
  const list = usePaged((p) => listGoals(projectId, p), filter === 'all' ? {} : { status: filter });
  const [editor, setEditor] = useState(null);
  const [progressGoal, setProgressGoal] = useState(null);
  const canManage = can('goal.manage');
  const canProgress = can('goal.progress');
  const ready = list.status === 'success';

  const replaceGoal = (goal) => list.setItems((prev) => prev.map((x) => (keyOf(x) === keyOf(goal) ? goal : x)));

  const onGoalSaved = (goal) => {
    if (editor?.goal) replaceGoal(goal);
    else list.reload();
  };

  const remove = async (goal) => {
    const ok = await confirmAlert({
      title: 'Delete this goal?',
      text: `${goal.title} and its progress history are removed.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await deleteGoal(projectId, keyOf(goal));
      toast.success('Goal deleted');
      list.setItems((prev) => prev.filter((x) => keyOf(x) !== keyOf(goal)));
    } catch (err) {
      if (err?.status !== 422) toast.error('Could not delete the goal');
    }
  };

  const openNew = () => setEditor({ goal: null });
  const newGoal = canManage ? (
    <Button variant="ember" icon="plus" size="sm" onClick={openNew} onPress={openNew}>
      New goal
    </Button>
  ) : null;

  const count = (status) => list.items.filter((g) => g.status === status).length;
  const stats = ready
    ? [
        { label: 'Goals', value: `${list.items.length}${list.hasMore ? '+' : ''}`, icon: 'goal' },
        { label: GOAL_STATUS.on_track.label, value: String(count('on_track')), icon: 'check' },
        { label: GOAL_STATUS.at_risk.label, value: String(count('at_risk')), icon: 'alert' },
        { label: GOAL_STATUS.done.label, value: String(count('done')), icon: 'check' },
      ]
    : undefined;

  const header = (
    <View className="gap-[14px] mb-[12px]">
      <PageHead
        title="Goals"
        sub="Numbers the project works toward. Linked work moves each gauge."
        stats={stats}
        actions={newGoal}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-[8px]">
        {FILTERS.map((f) => (
          <Chip key={f.value} pressed={filter === f.value} onPress={() => setFilter(f.value)}>
            {f.label}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );

  let empty = null;
  if (list.status === 'loading') empty = <Skeleton variant="cards" count={3} />;
  else if (list.status === 'error') empty = <EmptyState tone="error" title="Could not load goals" onRetry={list.reload} />;
  else if (ready && list.items.length === 0) {
    empty =
      filter === 'all' ? (
        <EmptyState
          icon="goal"
          title="No goals yet"
          text="Goals give the team one number to reach, such as items done or hours logged."
          action={newGoal}
        />
      ) : (
        <EmptyState icon="goal" title="No goals match this filter" text="Pick another status to see more goals." />
      );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={ready ? list.items : []}
        keyExtractor={keyOf}
        contentContainerClassName="p-[16px] pb-[40px]"
        ItemSeparatorComponent={() => <View className="h-[12px]" />}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        refreshControl={<RefreshControl refreshing={false} onRefresh={list.reload} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (list.hasMore && !list.loadingMore) list.loadMore();
        }}
        ListFooterComponent={list.loadingMore ? <ActivityIndicator className="mt-[16px]" /> : null}
        renderItem={({ item: goal }) => (
          <GoalCard
            goal={goal}
            canProgress={canProgress}
            canManage={canManage}
            onProgress={(g) => setProgressGoal(g)}
            onEdit={(g) => setEditor({ goal: g })}
            onDelete={remove}
          />
        )}
      />

      <GoalFormModal
        open={editor !== null}
        onClose={() => setEditor(null)}
        projectId={projectId}
        goal={editor?.goal ?? null}
        onSaved={onGoalSaved}
      />

      <ProgressModal
        open={progressGoal !== null}
        onClose={() => setProgressGoal(null)}
        projectId={projectId}
        goal={progressGoal}
        onSaved={replaceGoal}
      />
    </View>
  );
}
