// feat(screens/dashboards/DashboardDetailPage): show a dashboard's report widgets and let the owner add, remove and reorder them.
// The web 12-column grid collapses to a single column on mobile; packWidgets still stores x, y, w, h for the web layout.
import { useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import PageHead from "@/components/layout/PageHead";
import ReportCard from "@/components/reports/ReportCard";
import LineChart from "@/components/reports/LineChart";
import BarChart from "@/components/reports/BarChart";
import DonutChart from "@/components/reports/DonutChart";
import HBars from "@/components/reports/HBars";
import WidgetPicker, { WIDGET_TYPES } from "@/components/reports/WidgetPicker";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import Switch from "@/components/ui/Switch";
import { useProject } from "@/context/ProjectContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useResource } from "@/utils/useResource";
import { useMutation } from "@/utils/useMutation";
import { formatNumber } from "@/utils/format";
import { getDashboard, updateDashboard, summary, createdVsResolved, velocity, burndown, workload } from "@/libs/api/reports";
import { listSprints } from "@/libs/api/boards";

const DAY = 864e5;
const RANGE_DAYS = 90;
const GRID_COLUMNS = 12;
const keyOf = (row) => row.id ?? row._id;
const none = () => Promise.resolve({ data: null, meta: null });
const TYPE_LABEL = { ...Object.fromEntries((WIDGET_TYPES ?? []).map((w) => [w.type, w.label])), velocity: "Velocity" };
const STAT_LABEL = { created: "Created", resolved: "Resolved", open: "Open" };
const DEFAULT_SIZE = {
  stat: { w: 3, h: 4 },
  text: { w: 12, h: 3 },
};
const sizeFor = (type) => DEFAULT_SIZE[type] ?? { w: 6, h: 8 };
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lastDays = (days) => {
  const to = new Date();
  return { from: new Date(to.getTime() - (days - 1) * DAY).toISOString(), to: to.toISOString() };
};
const makeId = () => `w-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// Places widgets left to right on the 12-column grid and wraps to a new row when full.
function packWidgets(list) {
  let x = 0;
  let y = 0;
  let rowH = 0;
  return list.map((w) => {
    const span = clamp(Number(w.w) || 6, 1, GRID_COLUMNS);
    const h = clamp(Number(w.h) || 8, 1, 48);
    if (x + span > GRID_COLUMNS) {
      x = 0;
      y += rowH;
      rowH = 0;
    }
    const out = { ...w, x, y, w: span, h };
    x += span;
    rowH = Math.max(rowH, h);
    return out;
  });
}

// The data call a widget needs. Returns null when the widget draws from its own config only.
function widgetSource(projectId, widget) {
  const { type } = widget;
  const config = widget.config ?? {};
  if (type === "stat" || type === "donut") return () => summary(projectId);
  if (type === "lineChart") return () => createdVsResolved(projectId, lastDays(RANGE_DAYS));
  if (type === "barChart" || type === "velocity") return () => velocity(projectId);
  if (type === "workload") return () => workload(projectId);
  if (type === "burndown") return config.sprintId ? () => burndown(projectId, config.sprintId) : null;
  return null;
}

function WidgetCard({ projectId, widget, index, count, editing, onMove, onRemove }) {
  const { type } = widget;
  const config = widget.config ?? {};
  const title = widget.title || TYPE_LABEL[type] || type;
  const source = widgetSource(projectId, widget);
  const res = useResource(source ?? none, [projectId, type, config.sprintId]);
  const data = res.data;

  let body = null;
  let empty = false;
  let emptyText;
  let sub;

  if (type === "text") {
    body = <Text className="text-foreground text-[15px] leading-[23px]">{config.text || "No text yet."}</Text>;
  } else if (type === "stat" && data) {
    const created = data.created ?? 0;
    const resolved = data.resolved ?? 0;
    const metric = config.metric ?? "open";
    const value = metric === "created" ? created : metric === "resolved" ? resolved : Math.max(0, created - resolved);
    sub = STAT_LABEL[metric];
    body = (
      <View className="items-center gap-[4px] py-[18px]">
        <Text className="text-foreground text-[34px] leading-[34px] font-display tracking-[-0.85px] tabular-nums">{formatNumber(value)}</Text>
        <Text className="text-muted text-[13px] font-semibold">{STAT_LABEL[metric]} items</Text>
      </View>
    );
  } else if (type === "lineChart" && data) {
    const rows = data;
    empty = rows.length === 0;
    emptyText = "Items show up here once they are created or resolved.";
    sub = "Last 90 days";
    body = (
      <LineChart
        label="Created and resolved items per day"
        labels={rows.map((r) => String(r.date).slice(5))}
        series={[
          { name: "Created", tone: "ember", values: rows.map((r) => r.created ?? 0) },
          { name: "Resolved", tone: "spruce", values: rows.map((r) => r.resolved ?? 0) },
        ]}
      />
    );
  } else if ((type === "barChart" || type === "velocity") && data) {
    const sprints = data.sprints ?? [];
    empty = sprints.length === 0;
    emptyText = "Close a sprint to see its velocity.";
    sub = `Average ${data.average ?? 0} points per sprint`;
    body = (
      <BarChart
        label="Points finished per closed sprint"
        labels={sprints.map((s) => s.name)}
        values={sprints.map((s) => s.velocity ?? 0)}
        tone="ember"
      />
    );
  } else if (type === "donut" && data) {
    const parts = Object.entries(data.byType ?? {})
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }));
    const total = parts.reduce((n, p) => n + p.value, 0);
    empty = parts.length === 0;
    emptyText = "Items show up here once they exist.";
    body = <DonutChart label="Items by type" parts={parts} centerValue={formatNumber(total)} centerLabel="items" />;
  } else if (type === "burndown") {
    if (!config.sprintId) {
      empty = true;
      emptyText = "This widget has no sprint.";
    } else if (data) {
      const points = data.points ?? [];
      empty = points.length === 0;
      emptyText = "This sprint has no dates yet.";
      body = (
        <LineChart
          label="Remaining points against the ideal line"
          labels={points.map((p) => String(p.date).slice(5))}
          series={[
            { name: "Remaining", tone: "ember", values: points.map((p) => p.remaining) },
            { name: "Ideal", tone: "muted", values: points.map((p) => p.ideal), dashed: true },
          ]}
        />
      );
    }
  } else if (type === "workload" && data) {
    empty = data.length === 0;
    emptyText = "Nobody has open items assigned.";
    body = (
      <HBars
        label="Open items per assignee"
        rows={data.map((w) => ({
          key: String(w.userId),
          label: w.name,
          value: w.openItems ?? 0,
          valueText: `${w.openItems ?? 0} open`,
          tone: "iris",
        }))}
      />
    );
  }

  return (
    <ReportCard
      id={`w-${widget.id}`}
      title={title}
      sub={sub}
      status={res.status}
      error={res.error}
      onRetry={res.reload}
      empty={empty}
      emptyText={emptyText}
      tools={
        editing ? (
          <View className="flex-row items-center gap-[2px]">
            <Button
              iconOnly
              variant="ghost"
              size="sm"
              icon="up"
              accessibilityLabel={`Move ${title} up`}
              disabled={index === 0}
              onPress={() => onMove(-1)}
            />
            <Button
              iconOnly
              variant="ghost"
              size="sm"
              icon="down"
              accessibilityLabel={`Move ${title} down`}
              disabled={index === count - 1}
              onPress={() => onMove(1)}
            />
            <Button iconOnly variant="ghost" size="sm" icon="trash" accessibilityLabel={`Remove ${title}`} onPress={onRemove} />
          </View>
        ) : null
      }
    >
      {body}
    </ReportCard>
  );
}

export default function DashboardDetailPage() {
  const router = useRouter();
  const { projectId, can } = useProject();
  const { dashboardId } = useLocalSearchParams();
  const { user } = useAuth();
  const toast = useToast();
  const dash = useResource(() => getDashboard(projectId, dashboardId), [projectId, dashboardId]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState([]);
  const [picking, setPicking] = useState(false);

  const ready = dash.status === "success";
  const saved = dash.data?.widgets ?? [];
  const widgets = editing ? draft : saved;
  const canEdit = ready && (String(dash.data.ownerId) === String(user?.id) || can("issue.delete"));

  const save = useMutation((list) => updateDashboard(projectId, dashboardId, { widgets: packWidgets(list) }), {
    success: "Dashboard saved",
    error: "Could not save the dashboard",
  });

  const startEdit = () => {
    setDraft(saved.map((w) => ({ ...w })));
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft([]);
  };

  const onSave = async () => {
    const res = await save.run(draft);
    if (!res) return;
    dash.setData(res.data);
    setEditing(false);
    setDraft([]);
  };

  // Swaps a widget with its neighbour.
  const moveWidget = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= draft.length) return;
    setDraft((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const removeWidget = (i) => setDraft((prev) => prev.filter((_, idx) => idx !== i));

  const addWidget = async (type) => {
    setPicking(false);
    const size = sizeFor(type);
    const config = {};
    if (type === "text") config.text = "Write a note for the team.";
    if (type === "stat") config.metric = "open";
    if (type === "burndown") {
      try {
        const sprints = (await listSprints(projectId, { limit: 100 })).data ?? [];
        const pick = sprints.find((s) => s.state === "active") ?? sprints[0];
        if (pick) config.sprintId = keyOf(pick);
      } catch {
        toast.error("Could not load sprints");
      }
    }
    setDraft((prev) => [...prev, { id: makeId(), type, config, x: 0, y: 0, w: size.w, h: size.h }]);
  };

  const openPicker = () => {
    if (!editing) startEdit();
    setPicking(true);
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerClassName="p-[16px] gap-[16px] pb-[32px]"
        refreshControl={<RefreshControl refreshing={false} onRefresh={editing ? undefined : dash.reload} />}
      >
        <PageHead
          title={dash.data?.name ?? "Dashboard"}
          sub={dash.data?.description || undefined}
          actions={
            <Button variant="soft" icon="chevL" onPress={() => router.push(`/p/${projectId}/dashboards`)}>
              All dashboards
            </Button>
          }
        />

        {canEdit ? (
          <View className="gap-[10px]">
            <Switch checked={editing} onChange={(on) => (on ? startEdit() : cancelEdit())} label="Edit layout" />
            {editing ? (
              <View className="flex-row flex-wrap items-center gap-[8px]">
                <Button variant="soft" icon="plus" onPress={openPicker}>
                  Add widget
                </Button>
                <Button variant="ghost" onPress={cancelEdit}>
                  Discard
                </Button>
                <Button variant="ember" onPress={onSave} loading={save.pending}>
                  Save layout
                </Button>
              </View>
            ) : null}
          </View>
        ) : null}

        {dash.status === "loading" ? <Skeleton variant="cards" count={2} /> : null}

        {dash.status === "error" ? (
          <View className="bg-surface border border-border rounded-card p-[16px]">
            <EmptyState tone="error" title="Could not load this dashboard" onRetry={dash.reload} />
          </View>
        ) : null}

        {ready && widgets.length === 0 ? (
          <View className="bg-surface border border-border rounded-card p-[16px]">
            <EmptyState
              icon="dashboard"
              title="Add your first widget"
              text="Widgets show live numbers from this project's reports."
              action={
                canEdit ? (
                  <Button variant="ember" icon="plus" onPress={openPicker}>
                    Add widget
                  </Button>
                ) : undefined
              }
            />
          </View>
        ) : null}

        {ready && widgets.length > 0
          ? widgets.map((w, i) => (
              <WidgetCard
                key={w.id}
                projectId={projectId}
                widget={w}
                index={i}
                count={widgets.length}
                editing={editing}
                onMove={(dir) => moveWidget(i, dir)}
                onRemove={() => removeWidget(i)}
              />
            ))
          : null}
      </ScrollView>

      <WidgetPicker open={picking} onClose={() => setPicking(false)} onPick={addWidget} />
    </View>
  );
}
