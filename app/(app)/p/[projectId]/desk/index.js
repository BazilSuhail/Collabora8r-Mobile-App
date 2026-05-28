// feat(screens/serviceDesk/QueuePage): work the service desk queue by request type with live SLA countdowns.
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import PageHead from '@/components/layout/PageHead';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/DataTable';
import FilterChip from '@/components/ui/FilterChip';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { useProject } from '@/context/ProjectContext';
import { useToast } from '@/context/ToastContext';
import { listIssues } from '@/libs/api/issues';
import { listRequestTypes, listSlaTimers, pauseTimer, resumeTimer } from '@/libs/api/servicedesk';
import { emptyCopy } from '@/metadata/empty';
import { paths } from '@/routes/paths';
import { statusTone } from '@/utils/issueVisuals';
import { userAvatarSrc } from '@/utils/media';
import { usePaged } from '@/utils/usePaged';
import { useResource } from '@/utils/useResource';
import SlaCountdown from '@/components/serviceDesk/SlaCountdown';

const idOf = (row) => String(row?.id ?? row?._id ?? '');
const withId = (row) => ({ ...row, id: idOf(row) });

const STATUS_CHIPS = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'To do' },
  { value: 'inprogress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

const ACTIVE_TIMER = new Set(['running', 'paused']);

export default function QueuePage() {
  const { projectId, can } = useProject();
  const toast = useToast();
  const router = useRouter();
  const canAct = can('issue.edit');
  const canConfigure = can('config.manage');

  const [typeId, setTypeId] = useState('all');
  const [statusCat, setStatusCat] = useState('all');
  const [busyTimer, setBusyTimer] = useState(null);

  const typesQ = useResource(() => listRequestTypes(projectId, { limit: 100 }), [projectId]);
  const timersQ = useResource(() => listSlaTimers(projectId, { limit: 100 }), [projectId]);
  const issuesQ = usePaged((q) => listIssues(projectId, q), {
    requestType: typeId === 'all' ? undefined : typeId,
    status: statusCat === 'all' ? undefined : statusCat,
  });

  const types = (typesQ.data ?? []).map(withId);
  const typeNames = Object.fromEntries(types.map((t) => [t.id, t.name]));
  const timers = timersQ.data ?? [];

  // One timer per issue. A running or paused timer wins over a finished one.
  const timerByIssue = {};
  timers.forEach((t) => {
    const key = String(t.issueId);
    const current = timerByIssue[key];
    if (!current || (ACTIVE_TIMER.has(t.status) && !ACTIVE_TIMER.has(current.status))) timerByIssue[key] = t;
  });

  const replaceTimer = (rec) =>
    timersQ.setData((prev) => (prev ?? []).map((t) => (idOf(t) === idOf(rec) ? { ...t, ...rec, id: idOf(rec) } : t)));

  const setTimerStatus = async (timer, pausing) => {
    const call = pausing ? pauseTimer : resumeTimer;
    const res = await call(projectId, idOf(timer));
    replaceTimer(res.data ?? { ...timer, status: pausing ? 'paused' : 'running' });
  };

  const onToggleTimer = async (timer) => {
    const pausing = timer.status === 'running';
    setBusyTimer(idOf(timer));
    try {
      await setTimerStatus(timer, pausing);
      toast.success(pausing ? 'Timer paused' : 'Timer resumed', {
        undo: async () => {
          try {
            await setTimerStatus(timer, !pausing);
          } catch {
            // The API layer shows the error toast.
          }
        },
      });
    } catch {
      // The API layer shows the error toast.
    } finally {
      setBusyTimer(null);
    }
  };

  const issues = issuesQ.items.map(withId);

  const columns = [
    {
      key: 'key',
      label: 'Key',
      render: (row) => (
        <Text className="font-mono text-[12.5px] font-semibold text-foreground">{row.key}</Text>
      ),
    },
    {
      key: 'title',
      label: 'Summary',
      render: (row) => (
        <Text className="font-semibold text-foreground" numberOfLines={1}>
          {row.title}
        </Text>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (row) => <Text className="text-muted">{row.customer?.name ?? row.customerName ?? '—'}</Text>,
    },
    {
      key: 'requestType',
      label: 'Request type',
      render: (row) => <Text className="text-muted">{typeNames[String(row.requestTypeId)] ?? '—'}</Text>,
    },
    {
      key: 'sla',
      label: 'SLA',
      render: (row) => {
        const timer = timerByIssue[row.id];
        return timer ? (
          <SlaCountdown timer={timer} canAct={canAct} busy={busyTimer === idOf(timer)} onToggle={onToggleTimer} />
        ) : (
          <Text className="text-muted">No SLA</Text>
        );
      },
    },
    {
      key: 'assignee',
      label: 'Assignee',
      render: (row) =>
        row.assignee?.displayName ? (
          <View className="flex-row min-w-0 items-center gap-2">
            <Avatar
              name={row.assignee.displayName}
              src={userAvatarSrc({ avatarKey: row.assignee.avatarKey, avatarUrl: row.assignee.avatarUrl })}
              size="xs"
            />
            <Text className="text-foreground" numberOfLines={1}>
              {row.assignee.displayName}
            </Text>
          </View>
        ) : (
          <Text className="text-muted">Unassigned</Text>
        ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge tone={statusTone(row.statusCategory)} variant="status">
          {row.statusName ?? row.statusCategory}
        </Badge>
      ),
    },
  ];

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-12">
      <PageHead
        title="Service desk"
        sub="Customer requests by type. Each timer shows how long is left before the target."
        actions={
          canConfigure ? (
            <Button variant="soft" icon="gear" onPress={() => router.push(paths.deskSettings(projectId))}>
              Desk settings
            </Button>
          ) : null
        }
      />

      <View className="mb-3">
        <SegmentedControl
          as="tabs"
          label="Request types"
          value={typeId}
          onChange={setTypeId}
          options={[{ value: 'all', label: 'All' }, ...types.map((t) => ({ value: t.id, label: t.name }))]}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4 grow-0"
        contentContainerClassName="gap-2"
        accessibilityLabel="Filter by status"
      >
        {STATUS_CHIPS.map((c) => (
          <FilterChip key={c.value} pressed={statusCat === c.value} onPress={() => setStatusCat(c.value)}>
            {c.label}
          </FilterChip>
        ))}
      </ScrollView>

      <DataTable
        label="Service desk queue"
        columns={columns}
        rows={issues}
        rowKey="id"
        status={issuesQ.status}
        error={issuesQ.error}
        onRetry={issuesQ.reload}
        empty={emptyCopy('desk')}
        onRowClick={(row) => router.push(paths.issue(projectId, row.key))}
        hasMore={issuesQ.hasMore}
        onLoadMore={issuesQ.loadMore}
        loadingMore={issuesQ.loadingMore}
      />
    </ScrollView>
  );
}
