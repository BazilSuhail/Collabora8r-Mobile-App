// feat(screens/automation/AutomationPage): list automation rules with on/off switches and inspect their run history.
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import PageHead from '@/components/layout/PageHead';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DataTable from '@/components/ui/DataTable';
import FilterChip from '@/components/ui/FilterChip';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Switch from '@/components/ui/Switch';
import { useProject } from '@/context/ProjectContext';
import { useToast } from '@/context/ToastContext';
import { deleteRule, listRuns, listRules, toggleRule } from '@/libs/api/automation';
import { emptyCopy } from '@/metadata/empty';
import { paths } from '@/routes/paths';
import { relativeTime } from '@/utils/format';
import { usePaged } from '@/utils/usePaged';
import RuleRunModal from '@/components/automation/RuleRunModal';
import RunDetailDrawer from '@/components/automation/RunDetailDrawer';
import RunsTable from '@/components/automation/RunsTable';
import { triggerLabel } from '@/components/automation/RuleSection';

const withId = (row) => ({ ...row, id: String(row.id ?? row._id) });

const RUN_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
  { value: 'skipped', label: 'Skipped' },
];

export default function AutomationPage() {
  const { projectId, can } = useProject();
  const toast = useToast();
  const router = useRouter();
  const canManage = can('automation.manage');

  const [view, setView] = useState('rules');
  const [runFilter, setRunFilter] = useState('all');
  const [pendingId, setPendingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [runTarget, setRunTarget] = useState(null);
  const [openRun, setOpenRun] = useState(null);

  const rulesQ = usePaged((q) => listRules(projectId, q), {});
  const runsQ = usePaged((q) => listRuns(projectId, q), {
    status: runFilter === 'all' ? undefined : runFilter,
  });

  const rules = rulesQ.items.map(withId);
  const ruleNames = Object.fromEntries(rules.map((r) => [r.id, r.name]));

  const setEnabled = (id, enabled) =>
    rulesQ.setItems((prev) => prev.map((r) => (String(r.id ?? r._id) === id ? { ...r, enabled } : r)));

  // The server flips the flag on each toggle call, so undo is one more call.
  const flipRule = async (id, wasEnabled) => {
    const next = !wasEnabled;
    setEnabled(id, next);
    await toggleRule(projectId, id);
    return next;
  };

  const onToggle = async (rule) => {
    setPendingId(rule.id);
    try {
      const next = await flipRule(rule.id, rule.enabled);
      toast.success(next ? 'Rule enabled' : 'Rule disabled', {
        undo: async () => {
          try {
            await flipRule(rule.id, next);
          } catch {
            // The API layer already showed the error toast.
          }
        },
      });
    } catch {
      setEnabled(rule.id, rule.enabled);
    } finally {
      setPendingId(null);
    }
  };

  const confirmDelete = async () => {
    await deleteRule(projectId, deleteTarget.id);
    rulesQ.setItems((prev) => prev.filter((r) => String(r.id ?? r._id) !== deleteTarget.id));
    toast.success('Rule deleted');
  };

  const openRule = (id) => router.push(paths.automationRule(projectId, id));
  const newRule = () => router.push(paths.automationNew(projectId));

  const ruleColumns = [
    {
      key: 'name',
      label: 'Rule',
      render: (row) => (
        <View className="min-w-0">
          <Text className="font-semibold text-foreground" numberOfLines={1}>
            {row.name}
          </Text>
          {row.description ? (
            <Text className="text-[13px] text-muted" numberOfLines={1}>
              {row.description}
            </Text>
          ) : null}
        </View>
      ),
    },
    {
      key: 'trigger',
      label: 'Trigger',
      render: (row) => (
        <Badge tone="plain" icon="bolt">
          {triggerLabel(row.trigger?.type)}
        </Badge>
      ),
    },
    {
      key: 'enabled',
      label: 'On',
      // A native Switch handles its own touch, so it does not fire the row press.
      render: (row) => (
        <Switch
          checked={Boolean(row.enabled)}
          disabled={!canManage || pendingId === row.id}
          onChange={() => onToggle(row)}
          label={`Enable ${row.name}`}
          hideLabel
        />
      ),
    },
    {
      key: 'lastRun',
      label: 'Last run',
      render: (row) => {
        const when = row.lastRunAt ? relativeTime(row.lastRunAt) : row.runCount ? `${row.runCount} runs` : 'Never';
        return (
          <View className="flex-row items-center gap-[8px]">
            <Text className="text-muted">{when}</Text>
            {row.errorCount > 0 ? (
              <Badge tone="down" variant="count" label={`${row.errorCount} failed runs`}>
                {row.errorCount}
              </Badge>
            ) : null}
          </View>
        );
      },
    },
  ];

  const rowMenu = (row) => [
    { id: 'edit', label: 'Edit rule', icon: 'edit', onSelect: () => openRule(row.id) },
    { id: 'run', label: 'Run on issue', icon: 'play', onSelect: () => setRunTarget(row) },
    'separator',
    { id: 'delete', label: 'Delete', icon: 'trash', danger: true, onSelect: () => setDeleteTarget(row) },
  ];

  const header = (
    <View className="gap-3 mb-3">
      <PageHead
        title="Automation"
        sub="Rules run when issues change. Turn them on or off, or inspect their history."
        actions={
          canManage ? (
            <Button variant="ember" icon="plus" onPress={newRule}>
              New rule
            </Button>
          ) : null
        }
      />
      <SegmentedControl
        as="tabs"
        label="Automation views"
        value={view}
        onChange={setView}
        options={[
          { value: 'rules', label: 'Rules' },
          { value: 'runs', label: 'Runs' },
        ]}
      />
      {view === 'runs' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          accessibilityLabel="Filter runs by result"
          contentContainerClassName="gap-[8px]"
        >
          {RUN_FILTERS.map((f) => (
            <FilterChip key={f.value} pressed={runFilter === f.value} onPress={() => setRunFilter(f.value)}>
              {f.label}
            </FilterChip>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      {view === 'rules' ? (
        <DataTable
          label="Automation rules"
          columns={ruleColumns}
          rows={rules}
          rowKey="id"
          status={rulesQ.status}
          error={rulesQ.error}
          onRetry={rulesQ.reload}
          onRefresh={rulesQ.reload}
          empty={{
            ...emptyCopy('automation'),
            action: canManage ? (
              <Button variant="ember" onPress={newRule}>
                New rule
              </Button>
            ) : undefined,
          }}
          onRowClick={(row) => openRule(row.id)}
          rowMenu={canManage ? rowMenu : undefined}
          hasMore={rulesQ.hasMore}
          onLoadMore={rulesQ.loadMore}
          loadingMore={rulesQ.loadingMore}
          ListHeaderComponent={header}
          contentContainerClassName="p-4"
        />
      ) : (
        <RunsTable
          rows={runsQ.items}
          status={runsQ.status}
          error={runsQ.error}
          onRetry={runsQ.reload}
          onRefresh={runsQ.reload}
          hasMore={runsQ.hasMore}
          onLoadMore={runsQ.loadMore}
          loadingMore={runsQ.loadingMore}
          onOpen={setOpenRun}
          ruleNames={ruleNames}
          ListHeaderComponent={header}
          contentContainerClassName="p-4"
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete this rule?"
        text={deleteTarget ? `"${deleteTarget.name}" and its run history will be removed.` : ''}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDelete}
      />

      <RuleRunModal
        open={Boolean(runTarget)}
        onClose={() => setRunTarget(null)}
        pid={projectId}
        rule={runTarget}
        onRan={() => runsQ.reload()}
      />

      <RunDetailDrawer
        open={Boolean(openRun)}
        onClose={() => setOpenRun(null)}
        run={openRun}
        ruleName={openRun ? ruleNames[String(openRun.ruleId)] : undefined}
      />
    </View>
  );
}
