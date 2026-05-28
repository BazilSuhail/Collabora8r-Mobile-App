// feat(screens/reports/ReportsPage): chart a project's flow, velocity, burndown, time spent and workload from the report endpoints.
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import PageHead from '@/components/layout/PageHead';
import KpiCard from '@/components/reports/KpiCard';
import ReportCard from '@/components/reports/ReportCard';
import LineChart from '@/components/reports/LineChart';
import BarChart from '@/components/reports/BarChart';
import DonutChart from '@/components/reports/DonutChart';
import Heatmap from '@/components/reports/Heatmap';
import HBars from '@/components/reports/HBars';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { useProject } from '@/context/ProjectContext';
import { useResource } from '@/utils/useResource';
import { formatNumber } from '@/utils/format';
import { summary, createdVsResolved, velocity, burndown, timeSpent, workload } from '@/libs/api/reports';
import { listSprints } from '@/libs/api/boards';

const DAY = 864e5;
const RANGE_DAYS = 90;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const keyOf = (row) => row.id ?? row._id;
// "Mar 4" in UTC. Built by hand so it does not depend on full Intl support in the JS engine.
const shortDay = (s) => {
  const d = new Date(`${String(s).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return String(s ?? '');
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
};
const none = () => Promise.resolve({ data: null, meta: null });

export default function ReportsPage() {
  const { projectId } = useProject();
  const router = useRouter();
  const range = useMemo(() => {
    const to = new Date();
    return { from: new Date(to.getTime() - (RANGE_DAYS - 1) * DAY).toISOString(), to: to.toISOString() };
  }, [projectId]);

  const summaryRes = useResource(() => summary(projectId), [projectId]);
  const flowRes = useResource(() => createdVsResolved(projectId, range), [projectId]);
  const timeRes = useResource(() => timeSpent(projectId, range), [projectId]);
  const velocityRes = useResource(() => velocity(projectId), [projectId]);
  const workloadRes = useResource(() => workload(projectId), [projectId]);
  const sprintRes = useResource(() => listSprints(projectId, { limit: 100 }), [projectId]);

  const sprints = sprintRes.data ?? [];
  const [pickedSprint, setPickedSprint] = useState(null);
  const defaultSprint = sprints.find((s) => s.state === 'active') ?? sprints[0] ?? null;
  const sprintId = pickedSprint ?? (defaultSprint ? keyOf(defaultSprint) : null);
  const burnRes = useResource(() => (sprintId ? burndown(projectId, sprintId) : none()), [projectId, sprintId]);

  const ready = summaryRes.status === 'success';

  const totals = summaryRes.data ?? { created: 0, resolved: 0, byType: {} };
  const flow = flowRes.data ?? [];
  const timeRows = timeRes.data ?? [];
  const hoursTotal = timeRows.reduce((n, r) => n + (r.hours ?? 0), 0);
  const openCount = Math.max(0, totals.created - totals.resolved);
  const velocityData = velocityRes.data ?? { sprints: [], average: 0 };
  const burn = burnRes.data;
  const typeParts = Object.entries(totals.byType ?? {})
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));
  const typeTotal = typeParts.reduce((n, p) => n + p.value, 0);
  const workRows = workloadRes.data ?? [];

  const stats = ready
    ? [
        { label: 'Created', value: formatNumber(totals.created), icon: 'plus' },
        { label: 'Resolved', value: formatNumber(totals.resolved), icon: 'check' },
        { label: 'Hours, 90 days', value: formatNumber(Math.round(hoursTotal)), icon: 'time' },
      ]
    : undefined;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-12">
      <PageHead
        title="Reports"
        sub="Flow, velocity, burndown, time and workload for this project."
        stats={stats}
        actions={
          <Button variant="soft" icon="dashboard" onPress={() => router.push(`/p/${projectId}/dashboards`)}>
            Dashboards
          </Button>
        }
      />

      {summaryRes.status === 'loading' && <Skeleton variant="kpi" count={4} cols={2} />}
      {summaryRes.status === 'error' && (
        <View className="bg-surface border border-border rounded-card p-4 mb-4">
          <EmptyState tone="error" title="Could not load the summary" onRetry={summaryRes.reload} />
        </View>
      )}
      {ready && (
        // The 2x2 KPI grid stays two columns on a phone.
        <View className="flex-row flex-wrap -mx-1.5 mb-3">
          <View className="w-1/2 p-1.5">
            <KpiCard tone="ember" icon="plus" label="Created" value={totals.created} format={(v) => formatNumber(Math.round(v))} foot="All time" />
          </View>
          <View className="w-1/2 p-1.5">
            <KpiCard tone="spruce" icon="check" label="Resolved" value={totals.resolved} format={(v) => formatNumber(Math.round(v))} foot="All time" />
          </View>
          <View className="w-1/2 p-1.5">
            <KpiCard tone="iris" icon="list" label="Open" value={openCount} format={(v) => formatNumber(Math.round(v))} foot="Created minus resolved" />
          </View>
          <View className="w-1/2 p-1.5">
            <KpiCard tone="saffron" icon="time" label="Hours logged" value={Math.round(hoursTotal * 10) / 10} format={(v) => v.toFixed(1)} foot="Last 90 days" />
          </View>
        </View>
      )}

      {/* The desktop 12-column grid collapses to a single full-width stack. */}
      <View className="gap-4">
        <ReportCard
          id="rp-flow"
          title="Created vs resolved"
          sub="Last 90 days"
          status={flowRes.status}
          error={flowRes.error}
          onRetry={flowRes.reload}
          empty={flow.length === 0}
          emptyText="Items show up here once they are created or resolved."
        >
          <LineChart
            label="Created and resolved items per day"
            labels={flow.map((r) => shortDay(r.date))}
            series={[
              { name: 'Created', tone: 'ember', values: flow.map((r) => r.created ?? 0) },
              { name: 'Resolved', tone: 'spruce', values: flow.map((r) => r.resolved ?? 0) },
            ]}
          />
        </ReportCard>

        <ReportCard
          id="rp-velocity"
          title="Velocity"
          sub={`Average ${velocityData.average} points per sprint`}
          status={velocityRes.status}
          error={velocityRes.error}
          onRetry={velocityRes.reload}
          empty={velocityData.sprints.length === 0}
          emptyText="Close a sprint to see its velocity."
        >
          <BarChart
            label="Points finished per closed sprint"
            labels={velocityData.sprints.map((s) => s.name)}
            values={velocityData.sprints.map((s) => s.velocity)}
            tone="ember"
          />
        </ReportCard>

        <ReportCard
          id="rp-burndown"
          title="Burndown"
          sub={sprints.find((s) => keyOf(s) === sprintId)?.name}
          status={sprintRes.status === 'success' ? burnRes.status : sprintRes.status}
          error={burnRes.error ?? sprintRes.error}
          onRetry={burnRes.reload}
          empty={sprints.length === 0 || !burn || (burn.points ?? []).length === 0}
          emptyTitle={sprints.length === 0 ? 'No sprints yet' : 'Nothing to chart'}
          emptyText={sprints.length === 0 ? 'Create a sprint on the board to see its burndown.' : 'This sprint has no dates yet.'}
          tools={
            sprints.length > 0 ? (
              <Select
                label="Sprint"
                hideLabel
                size="sm"
                value={sprintId}
                onChange={(v) => setPickedSprint(v)}
                options={sprints.map((s) => ({ value: keyOf(s), label: s.name }))}
              />
            ) : null
          }
        >
          {burn ? (
            <LineChart
              label="Remaining points against the ideal line"
              labels={(burn.points ?? []).map((p) => shortDay(p.date))}
              series={[
                { name: 'Remaining', tone: 'ember', values: (burn.points ?? []).map((p) => p.remaining) },
                { name: 'Ideal', tone: 'muted', values: (burn.points ?? []).map((p) => p.ideal), dashed: true },
              ]}
            />
          ) : null}
        </ReportCard>

        <ReportCard
          id="rp-activity"
          title="Activity"
          sub="Items created per day, 13 weeks"
          status={flowRes.status}
          error={flowRes.error}
          onRetry={flowRes.reload}
          empty={flow.every((r) => !r.created)}
          emptyText="No items were created in this window."
        >
          <Heatmap label="Items created per day" days={flow.map((r) => ({ date: r.date, value: r.created ?? 0 }))} />
        </ReportCard>

        <ReportCard
          id="rp-time"
          title="Time spent"
          sub={`${formatNumber(Math.round(hoursTotal * 10) / 10)} hours in the last 90 days`}
          status={timeRes.status}
          error={timeRes.error}
          onRetry={timeRes.reload}
          empty={timeRows.every((r) => !r.hours)}
          emptyText="No time has been logged in this window."
        >
          <LineChart
            label="Hours logged per day"
            labels={timeRows.map((r) => shortDay(r.date))}
            series={[{ name: 'Hours', tone: 'iris', values: timeRows.map((r) => r.hours ?? 0) }]}
            format={(v) => v.toFixed(1)}
          />
        </ReportCard>

        <ReportCard
          id="rp-mix"
          title="Items by type"
          sub={`${formatNumber(typeTotal)} items`}
          status={summaryRes.status}
          error={summaryRes.error}
          onRetry={summaryRes.reload}
          empty={typeParts.length === 0}
          emptyText="Items show up here once they exist."
        >
          <DonutChart label="Items by type" parts={typeParts} centerValue={formatNumber(typeTotal)} centerLabel="items" />
        </ReportCard>

        <ReportCard
          id="rp-workload"
          title="Workload"
          sub="Open items per assignee"
          status={workloadRes.status}
          error={workloadRes.error}
          onRetry={workloadRes.reload}
          empty={workRows.length === 0}
          emptyText="Nobody has open items assigned."
        >
          <HBars
            label="Open items per assignee"
            rows={workRows.map((w) => ({
              key: String(w.userId),
              label: w.name,
              value: w.openItems ?? 0,
              valueText: `${w.openItems ?? 0} open`,
              tone: 'iris',
            }))}
          />
        </ReportCard>
      </View>
    </ScrollView>
  );
}
