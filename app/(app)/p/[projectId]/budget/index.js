// feat(screens/budget/BudgetPage): plan budget lines, record actual spend and compare planned against actual.
import { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import PageHead from '@/components/layout/PageHead';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DataTable from '@/components/ui/DataTable';
import EmptyState from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import SideModal from '@/components/ui/SideModal';
import Skeleton from '@/components/ui/Skeleton';
import { useProject } from '@/context/ProjectContext';
import { useToast } from '@/context/ToastContext';
import { budgetSummary, deleteBudgetLine, listActuals } from '@/libs/api/planning';
import { EMPTY } from '@/metadata/empty';
import { formatDate, formatMoney } from '@/utils/format';
import { useResource } from '@/utils/useResource';
import { usePaged } from '@/utils/usePaged';
import ActualModal from '@/components/budget/ActualModal';
import BudgetLineModal from '@/components/budget/BudgetLineModal';

const withIds = (res) => ({ ...res, data: res.data.map((r) => ({ ...r, id: r.id ?? r._id })) });
const fetchActuals = ({ pid, budgetLineId, ...p }) => listActuals(pid, { budgetLineId, ...p }).then(withIds);

// Share of planned spent so far: spruce under 85 percent, saffron to 100, ember over budget.
const meterTone = (pct) => (pct > 100 ? 'bg-ember' : pct >= 85 ? 'bg-saffron' : 'bg-spruce');

const KPI_TONE = { iris: 'text-iris-t', ember: 'text-ember-t', spruce: 'text-spruce-t' };

function ActualsBody({ projectId, lineId, currency }) {
  const actuals = usePaged(fetchActuals, { pid: projectId, budgetLineId: lineId });

  if (actuals.status === 'loading') return <Skeleton variant="feed" count={4} />;

  if (actuals.status === 'error') {
    return <EmptyState tone="error" title="Actuals did not load" text="Try again in a moment." onRetry={actuals.reload} />;
  }

  if (!actuals.items.length) {
    return <EmptyState icon="dollar" title="No actuals yet" text="Record spend against this line to see it here." />;
  }

  return (
    <View className="gap-3">
      <View className="gap-2">
        {actuals.items.map((a) => (
          <View key={a.id} className="flex-row items-center gap-3 rounded-[14px] border border-border bg-surface p-3">
            <View className="gap-0.5 min-w-0 flex-1">
              <Text numberOfLines={1} className="font-semibold text-foreground">
                {a.vendor || a.description || 'Spend'}
              </Text>
              <Text className="text-muted text-[12.5px]">{formatDate(a.incurredOn)}</Text>
            </View>
            <Text className="font-semibold text-foreground">{formatMoney(a.amount, a.currency ?? currency)}</Text>
          </View>
        ))}
      </View>
      {actuals.hasMore ? (
        <Button variant="soft" size="sm" onClick={actuals.loadMore} loading={actuals.loadingMore} disabled={actuals.loadingMore}>
          Show more
        </Button>
      ) : null}
    </View>
  );
}

export default function BudgetPage() {
  const { projectId, can } = useProject();
  const toast = useToast();
  const canEdit = can('budget.edit');
  const summary = useResource(() => budgetSummary(projectId), [projectId]);
  const [lineModal, setLineModal] = useState({ open: false, target: null });
  const [actualOpen, setActualOpen] = useState(false);
  const [actualLine, setActualLine] = useState('');
  const [drawer, setDrawer] = useState({ open: false, line: null });
  const [deleting, setDeleting] = useState(null);

  const lines = summary.data?.lines ?? [];
  const totals = summary.data?.totals ?? { planned: 0, actual: 0, variance: 0 };
  const currency = lines[0]?.currency ?? 'USD';
  const money = (v) => formatMoney(v, currency);

  const confirmDelete = async () => {
    try {
      await deleteBudgetLine(projectId, deleting.lineId);
      toast.success('Line deleted');
      setDeleting(null);
      summary.reload();
    } catch {
      // The API layer shows the failure. The dialog stays open so the user can retry.
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Line',
      render: (row) => (
        <View className="gap-0.5 min-w-0">
          <Text numberOfLines={1} className="font-semibold text-foreground">
            {row.name}
          </Text>
          {row.category ? <Text className="text-muted text-[12.5px]">{row.category}</Text> : null}
        </View>
      ),
    },
    { key: 'planned', label: 'Planned', align: 'right', render: (row) => formatMoney(row.planned, row.currency) },
    { key: 'actual', label: 'Actual', align: 'right', render: (row) => formatMoney(row.actual, row.currency) },
    {
      key: 'variance',
      label: 'Variance',
      render: (row) => {
        const over = row.actual > row.planned;
        const pct = row.planned ? (row.actual / row.planned) * 100 : row.actual > 0 ? 101 : 0;
        return (
          <View className="gap-1.5 min-w-[150px]">
            <View className="h-2 rounded-full bg-well overflow-hidden">
              <View className={`h-full rounded-full ${meterTone(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </View>
            <Text className={`text-[12.5px] ${over ? 'text-danger' : 'text-muted'}`}>
              {over ? 'Over by ' : ''}
              {formatMoney(Math.abs(row.variance), row.currency)}
            </Text>
          </View>
        );
      },
    },
  ];

  const rowMenu = canEdit
    ? (row) => [
        {
          id: 'actual',
          label: 'Record actual',
          icon: 'dollar',
          onSelect: () => {
            setActualLine(row.lineId);
            setActualOpen(true);
          },
        },
        { id: 'edit', label: 'Edit line', icon: 'edit', onSelect: () => setLineModal({ open: true, target: row }) },
        'separator',
        { id: 'delete', label: 'Delete line', icon: 'trash', danger: true, onSelect: () => setDeleting(row) },
      ]
    : undefined;

  const kpis = [
    { key: 'planned', tone: 'iris', icon: 'budget', label: 'Planned', value: totals.planned, foot: `${lines.length} lines` },
    { key: 'actual', tone: 'ember', icon: 'coins', label: 'Actual', value: totals.actual, foot: 'Recorded spend' },
    {
      key: 'variance',
      tone: totals.variance < 0 ? 'ember' : 'spruce',
      icon: totals.variance < 0 ? 'trendDown' : 'trend',
      label: totals.variance < 0 ? 'Over budget' : 'Remaining',
      value: totals.variance,
      foot: totals.variance < 0 ? 'Spend is above plan' : 'Within plan',
    },
  ];

  return (
    <>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="p-4 gap-4 pb-10"
        refreshControl={<RefreshControl refreshing={summary.status === 'loading' && !!summary.data} onRefresh={summary.reload} />}
      >
        <PageHead
          title="Budget"
          sub="Planned cost per line, what has been spent, and where the gap is."
          actions={
            canEdit ? (
              <>
                <Button variant="soft" icon="plus" onClick={() => setLineModal({ open: true, target: null })}>
                  Add line
                </Button>
                <Button
                  variant="ember"
                  icon="plus"
                  onClick={() => {
                    setActualLine('');
                    setActualOpen(true);
                  }}
                >
                  Record actual
                </Button>
              </>
            ) : null
          }
        />
        {summary.status === 'error' ? (
          <View className="rounded-card border border-border bg-surface p-5">
            <EmptyState tone="error" title="The budget did not load" text="Try again in a moment." onRetry={summary.reload} />
          </View>
        ) : (
          <View className="gap-3">
            {summary.status === 'success'
              ? kpis.map((k) => (
                  <View key={k.key} className="rounded-card border border-border bg-surface overflow-hidden">
                    <View className="gap-2.5 pt-4 px-[18px] pb-3.5">
                      <View className="flex-row items-center gap-2.5">
                        <View className="w-[38px] h-[38px] items-center justify-center rounded-ctl border border-border bg-surface-2">
                          <Icon name={k.icon} size={18} cls={KPI_TONE[k.tone]} />
                        </View>
                        <Text className="text-[13px] font-semibold text-muted">{k.label}</Text>
                      </View>
                      <Text numberOfLines={1} className="text-[26px] leading-[1.05] font-display tracking-[-0.02em] text-foreground">
                        {money(k.value)}
                      </Text>
                    </View>
                    <View className="border-t border-border bg-surface-2 py-2.5 px-[18px]">
                      <Text className="text-[12.5px] text-muted">{k.foot}</Text>
                    </View>
                  </View>
                ))
              : [0, 1, 2].map((i) => (
                  <View key={i} className="rounded-card border border-border bg-surface p-[18px]" accessibilityLabel="Loading">
                    <View className="h-3 w-2/5 rounded-xl bg-well" />
                    <View className="mt-3 h-[26px] w-3/5 rounded-xl bg-well" />
                  </View>
                ))}
          </View>
        )}
        {summary.status !== 'error' ? (
          <DataTable
            label="Budget lines"
            rowKey="lineId"
            columns={columns}
            rows={lines}
            status={summary.status}
            error={summary.error}
            onRetry={summary.reload}
            empty={{
              ...EMPTY.budget,
              action: canEdit ? (
                <Button variant="ember" size="sm" icon="plus" onClick={() => setLineModal({ open: true, target: null })}>
                  Add line
                </Button>
              ) : null,
            }}
            onRowClick={(row) => setDrawer({ open: true, line: row })}
            rowMenu={rowMenu}
          />
        ) : null}
      </ScrollView>
      <SideModal
        open={drawer.open}
        onClose={() => setDrawer((d) => ({ ...d, open: false }))}
        title={drawer.line?.name ?? 'Actuals'}
        subtitle="Spend recorded against this line"
      >
        {drawer.open && drawer.line ? (
          <ActualsBody projectId={projectId} lineId={drawer.line.lineId} currency={drawer.line.currency} />
        ) : null}
      </SideModal>
      <BudgetLineModal
        open={lineModal.open}
        onClose={() => setLineModal({ open: false, target: null })}
        projectId={projectId}
        line={lineModal.target}
        onSaved={() => {
          setLineModal({ open: false, target: null });
          summary.reload();
        }}
      />
      <ActualModal
        open={actualOpen}
        onClose={() => setActualOpen(false)}
        projectId={projectId}
        lines={lines}
        defaultLineId={actualLine}
        onSaved={() => {
          setActualOpen(false);
          summary.reload();
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete budget line?"
        text={`"${deleting?.name ?? ''}" is removed with its planned amount. This cannot be undone.`}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDelete}
      />
    </>
  );
}
