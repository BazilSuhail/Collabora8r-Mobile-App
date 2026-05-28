// feat(app/(app)/notifications/index): list all notifications with unread filtering and mark them read one by one or all at once.
import { useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";
import { listNotifications, markAllRead, markRead } from "@/libs/api/notifications";
import { listOrgProjects, listPersonalProjects } from "@/libs/api/projects";
import { usePaged } from "@/utils/usePaged";
import { useResource } from "@/utils/useResource";
import { useMutation } from "@/utils/useMutation";
import { useShell } from "@/context/ShellContext";
import { useOrg } from "@/context/OrgContext";
import { relativeTime } from "@/utils/format";
import { cn } from "@/utils/cn";
import { emptyCopy } from "@/metadata/empty";
import PageHead from "@/components/layout/PageHead";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Illustration from "@/components/ui/Illustration";
import Select from "@/components/ui/Select";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Skeleton from "@/components/ui/Skeleton";
import { Icon } from "@/components/ui/Icon";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
];

const idOf = (x) => String(x.id ?? x._id);

function NotificationRow({ n, first, onRead }) {
  const unread = !n.readAt;
  return (
    <View className={cn("flex-row items-start gap-3.5 py-3.5", !first && "border-t border-border")}>
      <View className="size-10 items-center justify-center rounded-xl bg-well">
        <Icon name="bell" />
      </View>
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center gap-2">
          {unread ? <View accessibilityLabel="Unread" className="size-2 rounded-full bg-accent" /> : null}
          <Text numberOfLines={1} className={cn("flex-1 text-foreground", unread ? "font-bold" : "font-semibold")}>
            {n.title ?? "Notification"}
          </Text>
        </View>
        {n.body ? <Text className="text-muted text-[13.5px] mt-0.5">{n.body}</Text> : null}
        <Text className="text-faint text-[12.5px] mt-1">{relativeTime(n.createdAt)}</Text>
      </View>
      {unread ? (
        <Button iconOnly variant="ghost" size="sm" icon="check" accessibilityLabel="Mark as read" onPress={() => onRead(n)} />
      ) : null}
    </View>
  );
}

export default function NotificationsPage() {
  const { refreshUnread } = useShell();
  const { orgId } = useOrg();
  const [filter, setFilter] = useState("all");
  const [projectId, setProjectId] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const projects = useResource(
    async () => {
      const personal = await listPersonalProjects();
      const org = orgId ? await listOrgProjects(orgId) : null;
      return { data: [...(personal.data ?? []), ...(org?.data ?? [])], meta: null };
    },
    [orgId],
  );

  const params = {
    unread: filter === "unread" ? true : undefined,
    projectId: projectId || undefined,
  };
  const list = usePaged((p) => listNotifications(p), params);

  const single = useMutation(markRead, { error: "Could not mark that notification as read." });
  const all = useMutation(markAllRead, {
    success: "All caught up",
    error: "Could not mark everything as read.",
  });

  const readOne = async (n) => {
    const res = await single.run(idOf(n));
    if (res === undefined) return;
    refreshUnread();
    list.setItems((prev) =>
      filter === "unread"
        ? prev.filter((x) => idOf(x) !== idOf(n))
        : prev.map((x) => (idOf(x) === idOf(n) ? { ...x, readAt: x.readAt ?? new Date().toISOString() } : x)),
    );
  };

  const readAll = async () => {
    const res = await all.run(projectId ? { projectId } : {});
    if (res === undefined) return;
    refreshUnread();
    list.reload();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await list.reload();
      refreshUnread();
    } finally {
      setRefreshing(false);
    }
  };

  const items = list.items ?? [];
  const empty =
    filter === "unread"
      ? { icon: "bellOff", title: "You're all caught up", text: "No unread notifications right now." }
      : emptyCopy("notifications");

  const projectOptions = [
    { value: "", label: "All projects" },
    ...(projects.data ?? []).map((p) => ({ value: idOf(p), label: p.name ?? p.key ?? "Project" })),
  ];

  const header = (
    <View className="pt-4">
      <PageHead
        title="Notifications"
        sub="Mentions, assignments and updates from your projects."
        actions={
          <Button variant="soft" icon="readAll" onPress={readAll} loading={all.pending} disabled={!items.length}>
            Mark all read
          </Button>
        }
      />
      <View className="mb-4 flex-row flex-wrap items-center gap-2.5">
        <SegmentedControl label="Filter notifications" value={filter} onChange={setFilter} options={FILTERS} />
        <View className="flex-1" />
        <Select
          variant="button"
          label="Project"
          hideLabel
          value={projectId}
          onChange={setProjectId}
          options={projectOptions}
          placeholder="All projects"
        />
      </View>
    </View>
  );

  let emptyBody = null;
  if (list.status === "loading") emptyBody = <Skeleton variant="feed" count={6} />;
  else if (list.status === "error") {
    emptyBody = (
      <EmptyState tone="error" title="Notifications did not load" text={list.error?.message} onRetry={list.reload} />
    );
  } else {
    emptyBody = (
      <View className="items-center gap-3">
        <Illustration name="empty" alt="" className="w-40" />
        <EmptyState {...empty} />
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-background"
      contentContainerClassName="px-4 pb-8"
      data={list.status === "success" ? items : []}
      keyExtractor={idOf}
      ListHeaderComponent={header}
      renderItem={({ item, index }) => (
        <View className={cn("bg-surface px-4 border-x border-border", index === 0 && "rounded-t-2xl border-t", index === items.length - 1 && "rounded-b-2xl border-b")}>
          <NotificationRow n={item} first={index === 0} onRead={readOne} />
        </View>
      )}
      ListEmptyComponent={
        <View className="rounded-2xl bg-surface border border-border p-5" accessibilityLiveRegion="polite">
          {emptyBody}
        </View>
      }
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (list.hasMore && !list.loadingMore) list.loadMore();
      }}
      ListFooterComponent={list.loadingMore ? <ActivityIndicator className="my-4" /> : null}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    />
  );
}
