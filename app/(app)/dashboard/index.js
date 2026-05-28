// feat(app/(app)/dashboard/index): give the signed-in user a home view of their open work, time, goals and recent project activity.
import { useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import ActivityList from "@/components/activity/ActivityList";
import { ProjectIssueSideModal } from "@/components/issues/IssueSideModal";
import IssueKpis from "@/components/issues/IssueKpis";
import IssueList from "@/components/issues/IssueList";
import PageHead from "@/components/layout/PageHead";
import NotificationList from "@/components/notifications/NotificationList";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { useShell } from "@/context/ShellContext";
import { listActivity } from "@/libs/api/projects";
import { listNotifications, markRead } from "@/libs/api/notifications";
import { myIssues, myWorklogs } from "@/libs/api/myWork";
import { listGoals } from "@/libs/api/reports";
import * as storage from "@/libs/storage";
import { cn } from "@/utils/cn";
import { formatDuration } from "@/utils/format";
import { useResource } from "@/utils/useResource";

const DAY_MS = 86400000;
const PROJECT_KEY = "c8r.project";
const idOf = (item) => item?.id ?? item?._id ?? null;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const addDays = (date, n) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
const localDay = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
};
const startOfWeek = (date) => {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return addDays(day, -((day.getDay() + 6) % 7));
};

function Panel({ title, sub, className, children }) {
  return (
    <View
      className={cn("bg-surface border border-border rounded-card p-[18px] gap-[12px]", className)}
      accessibilityRole="summary"
      accessibilityLabel={title}
    >
      <View className="min-h-[32px] flex-row items-center justify-between gap-[10px]">
        <Text className="text-foreground text-[16px] font-display tracking-[-0.16px]" accessibilityRole="header">
          {title}
        </Text>
        {sub ? <Text className="text-muted text-[12.5px]">{sub}</Text> : null}
      </View>
      {children}
    </View>
  );
}

// Seven bars, Monday to Sunday, scaled to the busiest day.
function TimeCard({ days, status, onRetry }) {
  if (status === "loading") return <Skeleton variant="feed" count={3} />;
  if (status === "error") return <EmptyState tone="error" title="Could not load your time" onRetry={onRetry} />;

  const max = Math.max(1, ...days.map((d) => d.seconds));
  const total = days.reduce((sum, d) => sum + d.seconds, 0);
  return (
    <View className="gap-[10px]">
      <Text className="text-muted text-[12.5px] font-semibold">Logged {formatDuration(total)} this week</Text>
      <View className="flex-row h-[180px] gap-[8px]" accessibilityLabel="Time logged per day this week">
        {days.map((d) => (
          <View
            key={d.label}
            className="flex-1 min-w-0 items-center gap-[8px]"
            accessible
            accessibilityLabel={`${d.label}: ${formatDuration(d.seconds)}`}
          >
            <View className="flex-1 w-full justify-end rounded-[10px] bg-well overflow-hidden">
              <View className="w-full min-h-[4px] bg-iris rounded-t-[4px]" style={{ height: `${(d.seconds / max) * 100}%` }} />
            </View>
            <Text className="text-muted text-[11px] font-semibold" numberOfLines={1}>{d.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// Meters for the first goals of the current project.
function GoalsCard({ goals, status, onRetry }) {
  if (status === "loading") return <Skeleton variant="feed" count={2} />;
  if (status === "error") return <EmptyState tone="error" title="Could not load goals" onRetry={onRetry} />;
  if (!goals.length) return <EmptyState icon="goal" title="No goals yet" text="Goals for this project show their progress here." />;

  return (
    <View className="gap-[14px]">
      {goals.slice(0, 4).map((g) => {
        const target = Number(g.target) || 0;
        const pct = target ? Math.min(100, ((Number(g.current) || 0) / target) * 100) : 0;
        return (
          <View key={idOf(g)} className="gap-[6px]">
            <View className="flex-row items-center justify-between gap-[10px]">
              <Text className="flex-1 font-bold text-foreground" numberOfLines={1}>
                {g.name ?? "Goal"}
              </Text>
              <Text className="text-muted text-[12.5px] font-semibold tabular-nums">
                {g.current ?? 0} / {g.target ?? 0}
              </Text>
            </View>
            <View className="h-[8px] rounded-full bg-well overflow-hidden">
              <View className="h-full rounded-full bg-spruce" style={{ width: `${pct}%` }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { openCreateIssue, refreshUnread } = useShell();
  const [pid, setPid] = useState(null);
  const [openIssue, setOpenIssue] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let alive = true;
    storage
      .get(PROJECT_KEY)
      .then((v) => {
        if (alive) setPid(v || null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const weekStart = startOfWeek(today);
  const weekEnd = addDays(weekStart, 7);
  const weekKey = weekStart.getTime();

  const issues = useResource(() => myIssues({ limit: 50 }), []);
  const worklogs = useResource(
    () =>
      myWorklogs({
        limit: 100,
        from: weekStart.toISOString(),
        to: addDays(weekStart, 6).toISOString(),
      }),
    [weekKey],
  );
  const notifications = useResource(() => listNotifications({ unread: true, limit: 5 }), []);
  const activity = useResource(() => (pid ? listActivity(pid, { limit: 8 }) : Promise.resolve({ data: [] })), [pid]);
  const goals = useResource(() => (pid ? listGoals(pid, { limit: 10 }) : Promise.resolve({ data: [] })), [pid]);

  const list = issues.data ?? [];
  const open = list.filter((i) => i.statusCategory !== "done");
  const dueThisWeek = open.filter((i) => {
    const d = localDay(i.dueDate);
    return d && d >= todayStart && d < weekEnd;
  }).length;
  const overdue = open.filter((i) => {
    const d = localDay(i.dueDate);
    return d && d < todayStart;
  }).length;
  const loggedSeconds = (worklogs.data ?? []).reduce((sum, w) => sum + (w.seconds ?? 0), 0);

  const kpiStatus =
    issues.status === "error" ? "error" : issues.status === "loading" || worklogs.status === "loading" ? "loading" : "success";
  const kpiItems = [
    { id: "open", label: "Assigned open", value: open.length, icon: "task", tone: "iris" },
    { id: "due", label: "Due this week", value: dueThisWeek, icon: "calendar", tone: "saffron" },
    { id: "overdue", label: "Overdue", value: overdue, icon: "alert", tone: overdue ? "ember" : "plain" },
    {
      id: "logged",
      label: "Logged this week",
      value: worklogs.status === "error" ? "Unavailable" : formatDuration(loggedSeconds),
      icon: "time",
      tone: "spruce",
    },
  ];

  const dueSoon = open
    .filter((i) => i.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 6);

  const days = WEEKDAYS.map((label) => ({ label, seconds: 0 }));
  for (const w of worklogs.data ?? []) {
    const d = localDay(w.date);
    if (!d) continue;
    const index = Math.round((d - weekStart) / DAY_MS);
    if (index >= 0 && index < 7) days[index].seconds += w.seconds ?? 0;
  }

  const markOne = async (id) => {
    setBusyId(id);
    try {
      await markRead(id);
      notifications.reload();
      refreshUnread?.();
    } catch {
      // The API client already reports failures.
    } finally {
      setBusyId(null);
    }
  };

  const reloadAll = () => {
    issues.reload();
    worklogs.reload();
    notifications.reload();
    activity.reload();
    goals.reload();
  };

  const firstName = user?.displayName?.split(" ")[0] ?? "there";
  const pickProject = (
    <Button variant="soft" size="sm" onPress={() => router.push("/projects")}>
      Choose a project
    </Button>
  );

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerClassName="p-[16px] gap-[16px] pb-[32px]"
        refreshControl={<RefreshControl refreshing={false} onRefresh={reloadAll} />}
      >
        <PageHead
          title={`Hello, ${firstName}`}
          sub="Your open work, time this week and recent project activity."
          actions={
            <Button variant="ember" icon="plus" onPress={() => openCreateIssue(pid ? { projectId: pid } : {})}>
              New issue
            </Button>
          }
        />

        <IssueKpis items={kpiItems} status={kpiStatus} onRetry={issues.reload} />

        <Panel title="Due soon" sub="Open issues by due date">
          <IssueList
            issues={dueSoon}
            status={issues.status}
            error={issues.error}
            onRetry={issues.reload}
            onOpen={(issue) => setOpenIssue({ id: idOf(issue), projectId: issue.projectId })}
            compact
            empty={{ icon: "calendar", title: "Nothing due soon", text: "Issues with a due date show up here." }}
          />
        </Panel>

        <Panel title="My time this week" sub="Hours per day">
          <TimeCard days={days} status={worklogs.status} onRetry={worklogs.reload} />
        </Panel>

        <Panel title="Goals" sub="Current project">
          {!pid ? (
            <EmptyState icon="project" title="Pick a project" text="Goals belong to a project." action={pickProject} />
          ) : (
            <GoalsCard goals={goals.data ?? []} status={goals.status} onRetry={goals.reload} />
          )}
        </Panel>

        <Panel title="Notifications" sub="Unread">
          {notifications.status === "loading" ? <Skeleton variant="feed" count={3} /> : null}
          {notifications.status === "error" ? (
            <EmptyState tone="error" title="Could not load notifications" onRetry={notifications.reload} />
          ) : null}
          {notifications.status === "success" && !(notifications.data ?? []).length ? (
            <EmptyState icon="bellOff" title="You are all caught up" />
          ) : null}
          {notifications.status === "success" && (notifications.data ?? []).length ? (
            <NotificationList items={notifications.data} onRead={markOne} busyId={busyId} />
          ) : null}
        </Panel>

        <Panel title="Recent activity" sub={pid ? "Current project" : undefined}>
          {!pid ? (
            <EmptyState
              icon="project"
              title="Pick a project"
              text="Activity is shown for the project you last used."
              action={pickProject}
            />
          ) : null}
          {pid && activity.status === "loading" ? <Skeleton variant="feed" count={4} /> : null}
          {pid && activity.status === "error" ? (
            <EmptyState tone="error" title="Could not load activity" onRetry={activity.reload} />
          ) : null}
          {pid && activity.status === "success" && !(activity.data ?? []).length ? (
            <EmptyState icon="history" title="No activity yet" />
          ) : null}
          {pid && activity.status === "success" && (activity.data ?? []).length ? (
            <ActivityList items={activity.data} />
          ) : null}
        </Panel>
      </ScrollView>

      {openIssue ? (
        <ProjectIssueSideModal
          open
          onClose={() => setOpenIssue(null)}
          projectId={openIssue.projectId}
          issueId={openIssue.id}
        />
      ) : null}
    </View>
  );
}
