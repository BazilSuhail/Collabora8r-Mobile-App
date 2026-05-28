// feat(app/(app)/my-work/index): list the user's assigned issues across projects, grouped by due date, with one-tap completion.
import { useMemo, useState } from "react";
import { ActivityIndicator, LayoutAnimation, Pressable, RefreshControl, SectionList, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ProjectIssueSideModal } from "@/components/issues/IssueSideModal";
import LogWorkModal from "@/components/issues/LogWorkModal";
import WorklogList from "@/components/issues/WorklogList";
import PageHead from "@/components/layout/PageHead";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Dropdown from "@/components/ui/Dropdown";
import EmptyState from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/context/ToastContext";
import { transitionIssue } from "@/libs/api/issues";
import { myIssues, myWorklogs } from "@/libs/api/myWork";
import { paths } from "@/routes/paths";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/format";
import { statusTone } from "@/utils/issueVisuals";
import { usePaged } from "@/utils/usePaged";

const idOf = (item) => item?.id ?? item?._id ?? null;

const GROUPS = [
  { id: "overdue", label: "Overdue" },
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "later", label: "Later" },
  { id: "none", label: "No due date" },
];

const TABS = [
  { value: "assigned", label: "Assigned" },
  { value: "time", label: "Time" },
];

const localDay = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

function bucketOf(issue, todayStart, weekEnd) {
  const due = localDay(issue.dueDate);
  if (!due) return "none";
  if (due < todayStart) return "overdue";
  if (due.getTime() === todayStart.getTime()) return "today";
  if (due < weekEnd) return "week";
  return "later";
}

function IssueRow({ issue, onOpen, onLog, onComplete }) {
  const router = useRouter();
  const done = issue.statusCategory === "done";
  const due = issue.dueDate ? formatDate(issue.dueDate) : null;
  const items = [
    { id: "open", label: "Open", icon: "chevR", onSelect: () => onOpen(issue) },
    {
      id: "project",
      label: "Open in project",
      icon: "project",
      onSelect: () => router.push(paths.issue(issue.projectId, issue.key)),
    },
    { id: "log", label: "Log work", icon: "time", onSelect: () => onLog(issue) },
  ];

  return (
    <View className="flex-row items-center gap-3 px-3 py-2.5 rounded-2xl bg-surface">
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done, disabled: done }}
        accessibilityLabel={`Mark ${issue.key} done`}
        disabled={done}
        onPress={() => onComplete(issue)}
        hitSlop={8}
        className={cn(
          "size-6 shrink-0 items-center justify-center rounded-lg border-[1.5px]",
          done ? "bg-spruce border-spruce" : "bg-surface border-line-2",
        )}
      >
        {done ? <Icon name="check" size={14} className="text-white" /> : null}
      </Pressable>
      <Pressable className="min-w-0 flex-1 gap-0.5 active:opacity-70" onPress={() => onOpen(issue)}>
        <Text numberOfLines={1} className={cn("font-bold text-foreground", done && "text-muted line-through")}>
          <Text className="text-muted">{issue.key} </Text>
          {issue.summary ?? issue.title}
        </Text>
        <Text numberOfLines={1} className="text-muted text-xs font-semibold">
          {[issue.projectName, due ? `due ${due}` : null].filter(Boolean).join(" · ")}
        </Text>
      </Pressable>
      <Badge variant="status" tone={statusTone(issue.statusCategory)}>
        {issue.statusName ?? "To do"}
      </Badge>
      <Dropdown
        label={`Actions for ${issue.key}`}
        items={items}
        trigger={(p) => (
          <Button iconOnly variant="ghost" size="sm" icon="more" accessibilityLabel={`Actions for ${issue.key}`} {...p} />
        )}
      />
    </View>
  );
}

// Assigned issues, grouped by due date. Completing a row moves it to Done with an undo.
function AssignedList({ header, onOpen, onLog }) {
  const toast = useToast();
  const { items, status, hasMore, loadMore, loadingMore, reload, setItems } = usePaged((params) => myIssues(params));
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date();
  const stamp = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  const sections = useMemo(() => {
    const todayStart = new Date(stamp);
    const weekEnd = new Date(todayStart.getFullYear(), todayStart.getMonth(), todayStart.getDate() + 7);
    const map = new Map(GROUPS.map((g) => [g.id, []]));
    for (const issue of items ?? []) map.get(bucketOf(issue, todayStart, weekEnd)).push(issue);
    return GROUPS.map((g) => ({ ...g, data: map.get(g.id) })).filter((g) => g.data.length);
  }, [items, stamp]);

  // A row that changes group glides to its new place.
  const patch = (id, fields) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setItems((prev) => prev.map((i) => (idOf(i) === id ? { ...i, ...fields } : i)));
  };

  const undo = async (issue, before) => {
    try {
      await transitionIssue(issue.projectId, idOf(issue), { toStatus: before.statusId });
    } catch {
      toast.error(`Could not move ${issue.key}`);
      return;
    }
    patch(idOf(issue), before);
    toast.success(`${issue.key} moved back`);
  };

  const complete = async (issue) => {
    const before = {
      statusId: issue.statusId,
      statusName: issue.statusName,
      statusCategory: issue.statusCategory,
    };
    try {
      await transitionIssue(issue.projectId, idOf(issue), { toStatus: "done" });
    } catch {
      toast.error(`Could not move ${issue.key}`);
      return;
    }
    patch(idOf(issue), { statusId: "done", statusName: "Done", statusCategory: "done" });
    toast.success(`${issue.key} marked done`, { undo: () => undo(issue, before) });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await reload();
    } finally {
      setRefreshing(false);
    }
  };

  let empty = null;
  if (status === "loading") empty = <Skeleton variant="feed" count={6} />;
  else if (status === "error") empty = <EmptyState tone="error" title="Could not load your issues" onRetry={reload} />;
  else if (!items?.length) {
    empty = (
      <EmptyState icon="task" title="Nothing assigned to you" text="Issues assigned to you across projects show up here." />
    );
  }

  return (
    <SectionList
      className="flex-1 bg-background"
      contentContainerClassName="px-4 pb-8"
      sections={status === "success" ? sections : []}
      keyExtractor={(item) => String(idOf(item))}
      stickySectionHeadersEnabled
      ListHeaderComponent={header}
      ListEmptyComponent={<View className="rounded-2xl bg-surface border border-border p-4">{empty}</View>}
      renderSectionHeader={({ section }) => (
        <View className="bg-background pt-4 pb-1.5" accessibilityRole="header">
          <Text className="text-muted text-xs font-bold uppercase tracking-wider">
            {section.label} {section.data.length}
          </Text>
        </View>
      )}
      renderItem={({ item }) => <IssueRow issue={item} onOpen={onOpen} onLog={onLog} onComplete={complete} />}
      ItemSeparatorComponent={() => <View className="h-0.5" />}
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (hasMore && !loadingMore) loadMore();
      }}
      ListFooterComponent={loadingMore ? <ActivityIndicator className="my-4" /> : null}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    />
  );
}

// Logged time across projects for the signed-in user.
function TimeList() {
  const { items, status, hasMore, loadMore, loadingMore, reload } = usePaged((params) => myWorklogs(params));
  return (
    <WorklogList
      items={items}
      status={status}
      onRetry={reload}
      hasMore={hasMore}
      loadingMore={loadingMore}
      onLoadMore={loadMore}
      emptyTitle="No time logged yet"
      emptyText="Log work from an issue, or from the menu on any row."
    />
  );
}

export default function MyWorkPage() {
  const [tab, setTab] = useState("assigned");
  const [openIssue, setOpenIssue] = useState(null);
  const [logFor, setLogFor] = useState(null);

  const header = (
    <View className="pt-4">
      <PageHead title="My work" sub="Issues assigned to you across projects, grouped by due date." />
      <View className="mb-2">
        <SegmentedControl label="My work views" value={tab} onChange={setTab} options={TABS} />
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      {tab === "assigned" ? (
        <AssignedList
          header={header}
          onOpen={(issue) => setOpenIssue({ id: idOf(issue), projectId: issue.projectId })}
          onLog={setLogFor}
        />
      ) : (
        <View className="flex-1 px-4">
          {header}
          <View className="flex-1 rounded-2xl bg-surface border border-border p-3 mb-4">
            <TimeList />
          </View>
        </View>
      )}

      {openIssue ? (
        <ProjectIssueSideModal
          open
          onClose={() => setOpenIssue(null)}
          projectId={openIssue.projectId}
          issueId={openIssue.id}
        />
      ) : null}
      {logFor ? (
        <LogWorkModal
          open
          onClose={() => setLogFor(null)}
          projectId={logFor.projectId}
          issueId={idOf(logFor)}
        />
      ) : null}
    </View>
  );
}
