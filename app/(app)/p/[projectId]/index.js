// feat(screens/projects/ProjectOverviewPage): summarize a project's status, active sprint, goals and recent activity on one screen.
import { useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import Skeleton from "@/components/ui/Skeleton";
import { useProject } from "@/context/ProjectContext";
import { listSprints } from "@/libs/api/boards";
import { summary, listGoals } from "@/libs/api/reports";
import { listActivity } from "@/libs/api/projects";
import { paths } from "@/routes/paths";
import { emptyCopy } from "@/metadata/empty";
import { relativeTime } from "@/utils/format";
import { cn } from "@/utils/cn";
import { themePath } from "@/utils/media";
import { usePaged } from "@/utils/usePaged";
import { useResource } from "@/utils/useResource";

const CARD = "rounded-2xl bg-surface border border-border";

const KIND_TEXT = {
  issueCreated: "created an issue",
  issueUpdated: "updated an issue",
  statusChanged: "changed a status",
  commentAdded: "commented on",
  sprintStarted: "started a sprint",
  sprintClosed: "closed a sprint",
  memberAdded: "added a member",
  memberRemoved: "removed a member",
  releaseShipped: "shipped a release",
  pageUpdated: "updated a wiki page",
};

// themePath may return a URL string or a bundled asset (require result).
const toImageSource = (src) => (typeof src === "string" ? { uri: src } : src);

// Shows a card's own loading, error or empty state. Returns null when it has content to show.
function CardState({ status, error, onRetry, empty }) {
  if (status === "loading") return <Skeleton variant="feed" count={3} />;
  if (status === "error") {
    return <EmptyState tone="error" icon="alert" title="Could not load this section" text={error?.message} onRetry={onRetry} />;
  }
  if (empty) return <EmptyState icon={empty.icon} title={empty.title} text={empty.text} />;
  return null;
}

function SectionTitle({ children }) {
  return (
    <Text className="text-lg font-semibold text-foreground" accessibilityRole="header">
      {children}
    </Text>
  );
}

function ProgressBar({ pct, className }) {
  return (
    <View className="h-2 overflow-hidden rounded-full bg-well">
      <View className={cn("h-full rounded-full", className)} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </View>
  );
}

export default function ProjectOverviewPage() {
  const router = useRouter();
  const { projectId, project, status: projectStatus, statuses } = useProject();
  const ready = projectStatus === "success" && Boolean(project);
  const [failedThemeSrc, setFailedThemeSrc] = useState(null);

  const stats = useResource(() => summary(projectId), [projectId]);
  const goals = useResource(() => listGoals(projectId, { limit: 20 }), [projectId]);
  const sprint = useResource(() => listSprints(projectId, { state: "active", limit: 1 }), [projectId]);
  const activity = usePaged((p) => listActivity(projectId, p), { projectId });

  const labelOf = (key) => (statuses ?? []).find((s) => s.id === key || s.name === key)?.name ?? key;
  const byStatus = stats.data?.byStatus ?? {};
  const statusTotal = Object.values(byStatus).reduce((sum, n) => sum + n, 0);
  const activeSprint = (sprint.data ?? [])[0] ?? null;
  const goalList = goals.data ?? [];
  const activityItems = activity.items ?? [];

  const themeSrc = themePath(project?.themeKey);
  const imageSrc = themeSrc && failedThemeSrc !== themeSrc ? themeSrc : null;
  const headline = project?.headline || project?.description || "";
  const resolvedCount = stats.data?.resolved ?? 0;
  const statTiles = [
    {
      key: "open",
      icon: "flag",
      label: "Open",
      value: stats.status === "success" ? Math.max(0, statusTotal - resolvedCount) : "-",
    },
    { key: "done", icon: "check", label: "Done", value: stats.status === "success" ? resolvedCount : "-" },
    { key: "created", icon: "chartLine", label: "Created", value: stats.status === "success" ? (stats.data?.created ?? 0) : "-" },
    {
      key: "sprint",
      icon: "clock",
      label: "Active sprint",
      value: sprint.status === "success" ? (activeSprint?.name ?? "None") : "-",
    },
  ];

  const sections = [
    { label: "Board", icon: "kanban", to: paths.board(projectId) },
    { label: "Backlog", icon: "backlog", to: paths.backlog(projectId) },
    { label: "Sprints", icon: "sprint", to: paths.backlog(projectId) },
    { label: "Issues", icon: "task", to: paths.issues(projectId) },
    { label: "Releases", icon: "release", to: paths.releases(projectId) },
    { label: "Wiki", icon: "wiki", to: paths.wiki(projectId) },
    { label: "Reports", icon: "analytics", to: paths.reports(projectId) },
    { label: "Timesheet", icon: "timesheet", to: paths.timesheet(projectId) },
  ];

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 pt-4 pb-8 gap-4">
      {/* Banner */}
      <View
        accessibilityState={{ busy: !ready }}
        className={cn(
          "relative overflow-hidden rounded-2xl h-48",
          !ready && "bg-well",
          ready && !imageSrc && "bg-ember-soft",
        )}
      >
        {ready && !imageSrc ? <View className="absolute right-0 top-0 bottom-0 w-1/2 bg-iris-soft opacity-70" /> : null}
        {ready && imageSrc ? (
          <>
            <Image
              source={toImageSource(imageSrc)}
              onError={() => setFailedThemeSrc(themeSrc)}
              resizeMode="cover"
              className="absolute inset-0 w-full h-full"
              accessibilityIgnoresInvertColors
            />
            <View className="absolute inset-x-0 bottom-0 h-3/4 bg-surface opacity-60" />
          </>
        ) : null}
        {ready ? (
          <View className="absolute inset-x-0 bottom-0 flex-row items-end justify-between gap-3 p-5">
            <View className="min-w-0 flex-1">
              {project?.key ? (
                <View className="flex-row">
                  <Badge tone="iris">{project.key}</Badge>
                </View>
              ) : null}
              <Text numberOfLines={1} className="mt-2 text-2xl font-bold text-foreground" accessibilityRole="header">
                {project?.name ?? "Overview"}
              </Text>
              {headline ? (
                <Text numberOfLines={2} className="mt-1 text-sm text-muted">
                  {headline}
                </Text>
              ) : null}
            </View>
            <Button variant="soft" size="sm" icon="kanban" onPress={() => router.push(paths.board(projectId))}>
              Open board
            </Button>
          </View>
        ) : (
          <View className="flex-1 items-center justify-center" accessibilityLabel="Loading">
            <ActivityIndicator />
          </View>
        )}
      </View>

      {/* Section nav */}
      <View className={`${CARD} p-2`}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          accessibilityLabel="Project sections"
          contentContainerClassName="items-center gap-2"
        >
          {sections.map((item) => (
            <Button key={item.label} variant="ghost" size="sm" icon={item.icon} onPress={() => router.push(item.to)}>
              {item.label}
            </Button>
          ))}
          <Button variant="soft" size="sm" icon="edit" onPress={() => router.push(paths.projectSettings(projectId))}>
            Edit project
          </Button>
        </ScrollView>
      </View>

      {!ready ? (
        <View className={`${CARD} p-6`}>
          <Skeleton variant="kpi" count={3} />
        </View>
      ) : (
        <View className="gap-4">
          {/* Stat tiles, 2x2 */}
          <View className="flex-row flex-wrap -m-1.5">
            {statTiles.map((t) => (
              <View key={t.key} className="w-1/2 p-1.5">
                <View className={`${CARD} p-3.5 min-w-0`}>
                  <View className="flex-row items-center gap-1.5">
                    <Icon name={t.icon} size={14} />
                    <Text numberOfLines={1} className="flex-1 text-xs font-semibold text-muted">
                      {t.label}
                    </Text>
                  </View>
                  <Text numberOfLines={1} className="mt-1.5 text-[22px] font-bold text-foreground" style={{ fontVariant: ["tabular-nums"] }}>
                    {t.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Status breakdown */}
          <View className={`${CARD} p-5`}>
            <SectionTitle>Status breakdown</SectionTitle>
            <View className="mt-3.5 gap-3">
              {stats.status !== "success" || statusTotal === 0 ? (
                <CardState
                  status={stats.status}
                  error={stats.error}
                  onRetry={stats.reload}
                  empty={
                    stats.status === "success"
                      ? { icon: "chartLine", title: "No status data yet", text: emptyCopy("reports").text }
                      : null
                  }
                />
              ) : (
                Object.entries(byStatus).map(([key, count]) => (
                  <View key={key} className="gap-1.5">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-semibold text-foreground">{labelOf(key)}</Text>
                      <Text className="text-sm text-muted">{count}</Text>
                    </View>
                    <ProgressBar pct={(count / statusTotal) * 100} className="bg-spruce" />
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Goals */}
          <View className={`${CARD} p-5`}>
            <SectionTitle>Goals</SectionTitle>
            <View className="mt-3.5 gap-3.5">
              <CardState
                status={goals.status}
                error={goals.error}
                onRetry={goals.reload}
                empty={goals.status === "success" && goalList.length === 0 ? emptyCopy("goals") : null}
              />
              {goals.status === "success"
                ? goalList.map((g) => {
                    const pct = g.target ? (g.current / g.target) * 100 : 0;
                    return (
                      <View key={g.id} className="gap-1.5">
                        <View className="flex-row items-center justify-between gap-2.5">
                          <Text numberOfLines={1} className="flex-1 text-sm font-semibold text-foreground">
                            {g.name}
                          </Text>
                          <Text className="text-sm text-muted">
                            {g.current ?? 0}/{g.target ?? 0} {g.unit ?? ""}
                          </Text>
                        </View>
                        <ProgressBar pct={pct} className="bg-iris" />
                      </View>
                    );
                  })
                : null}
            </View>
          </View>

          {/* Recent activity */}
          <View className={`${CARD} p-5`}>
            <SectionTitle>Recent activity</SectionTitle>
            <View className="mt-3.5">
              <CardState
                status={activity.status}
                error={activity.error}
                onRetry={activity.reload}
                empty={
                  activity.status === "success" && activityItems.length === 0 ? emptyCopy("project-overview") : null
                }
              />
              {activity.status === "success" && activityItems.length > 0 ? (
                <View className="gap-3.5">
                  {activityItems.map((a) => (
                    <View key={a.id ?? a._id} className="flex-row items-start gap-3">
                      <Avatar name={a.actorName} src={a.actorAvatar} size="sm" />
                      <View className="min-w-0 flex-1">
                        <Text className="text-sm text-foreground">
                          <Text className="font-semibold">{a.actorName || "Someone"}</Text>{" "}
                          {a.summary || KIND_TEXT[a.kind] || a.kind}
                          {a.itemKey ? <Text className="text-muted"> {a.itemKey}</Text> : null}
                          {a.itemTitle ? <Text className="text-muted"> {a.itemTitle}</Text> : null}
                        </Text>
                        <Text className="text-xs text-muted">{a.at ? relativeTime(a.at) : ""}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}
              {activity.hasMore ? (
                <View className="mt-4 flex-row justify-center">
                  <Button variant="soft" size="sm" loading={activity.loadingMore} onPress={activity.loadMore}>
                    Show more
                  </Button>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
