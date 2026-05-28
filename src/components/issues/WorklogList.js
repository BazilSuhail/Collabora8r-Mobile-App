import { Text, View } from "react-native";
import { formatDate, formatDuration } from "@/utils/format";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import Skeleton from "@/components/ui/Skeleton";

// Logged time rows. showIssue adds the issue key and summary (My work, Timesheet).
// hasMore and onLoadMore come from usePaged. Loading, error and empty states live here.
export default function WorklogList({
  items = [],
  status = "success",
  onRetry,
  showIssue = true,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  emptyTitle = "No time logged yet",
  emptyText,
}) {
  if (status === "loading") return <Skeleton variant="feed" count={4} />;
  if (status === "error") {
    return <EmptyState tone="error" title="Could not load logged time" onRetry={onRetry} />;
  }
  if (!items.length) return <EmptyState icon="time" title={emptyTitle} text={emptyText} />;

  return (
    <View className="gap-[10px]">
      <View className="gap-[2px]" accessibilityLabel="Logged time">
        {items.map((w) => {
          const id = w.id ?? w._id;
          const key = w.issueKey ?? w.issue?.key;
          const summary = w.issueSummary ?? w.issue?.summary;
          const who = w.user?.displayName ?? w.userName ?? "";
          const when = w.date ? formatDate(w.date) : "";
          return (
            <WorklogRow
              key={id}
              issueKey={showIssue ? key : null}
              title={summary || w.comment || "Work logged"}
              meta={[when, who, w.billable ? "Billable" : null].filter(Boolean).join(" · ")}
              seconds={w.seconds ?? 0}
            />
          );
        })}
      </View>
      {hasMore ? (
        <View className="flex-row justify-center">
          <Button variant="soft" size="sm" loading={loadingMore} onClick={onLoadMore}>
            Show more
          </Button>
        </View>
      ) : null}
    </View>
  );
}

function WorklogRow({ issueKey, title, meta, seconds }) {
  return (
    <View className="flex-row items-center gap-[12px] py-[10px] border-b border-border">
      <View className="h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[12px] border border-border bg-surface-2">
        <Icon name="time" size={18} />
      </View>
      <View className="min-w-0 flex-1 gap-[2px]">
        <Text numberOfLines={1} className="font-bold text-foreground">
          {issueKey ? <Text className="text-muted">{issueKey} </Text> : null}
          {title}
        </Text>
        {meta ? <Text className="text-muted text-[12px] font-semibold">{meta}</Text> : null}
      </View>
      <Text className="font-bold text-foreground" style={{ fontVariant: ["tabular-nums"] }}>
        {formatDuration(seconds)}
      </Text>
    </View>
  );
}
