import { isValidElement } from "react";
import { View, Text, Pressable } from "react-native";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { formatDateTime } from "@/utils/format";

// Audit rows are read only. A table does not fit a phone, so each entry is a card.
// Tapping a card calls onRowClick(entry) so the screen can open the detail drawer.
export default function AuditTable({
  entries,
  status,
  error,
  onRetry,
  hasMore,
  onLoadMore,
  loadingMore,
  onRowClick,
  empty,
}) {
  const rows = (entries ?? []).map((e) => ({ ...e, id: e.id ?? e._id }));

  if (status === "loading") {
    return (
      <View accessibilityState={{ busy: true }}>
        <Skeleton variant="rows" count={6} />
      </View>
    );
  }
  if (status === "error") {
    return (
      <EmptyState
        tone="error"
        title="Could not load the audit log"
        text={error?.message}
        onRetry={onRetry}
      />
    );
  }
  if (!rows.length) {
    if (isValidElement(empty)) return empty;
    return (
      <EmptyState
        icon={empty?.icon ?? "history"}
        title={empty?.title ?? "No audit entries"}
        text={empty?.text}
      />
    );
  }

  return (
    <View className="gap-[8px]" accessibilityLabel="Audit log">
      {rows.map((e) => (
        <Pressable
          key={e.id}
          accessibilityRole="button"
          onPress={onRowClick ? () => onRowClick(e) : undefined}
          className="gap-[8px] rounded-[14px] border border-border bg-surface p-[12px] active:opacity-80"
        >
          <View className="flex-row items-center justify-between gap-[10px]">
            <View className="shrink">
              <Badge tone="plain">{e.action}</Badge>
            </View>
            <Text className="text-[12.5px] text-muted" style={{ fontVariant: ["tabular-nums"] }}>
              {e.at ? formatDateTime(e.at) : "-"}
            </Text>
          </View>
          <View className="min-w-0">
            <Text className="text-foreground" numberOfLines={1}>
              {e.targetName || "-"}
            </Text>
            {e.targetType ? <Text className="text-[12.5px] text-muted">{e.targetType}</Text> : null}
          </View>
          <View className="flex-row min-w-0 items-center gap-[10px]">
            <Avatar name={e.actorName || "System"} size="xs" />
            <Text className="flex-1 text-foreground" numberOfLines={1}>
              {e.actorName || "System"}
            </Text>
          </View>
        </Pressable>
      ))}
      {hasMore && onLoadMore ? (
        <View className="items-center pt-[6px]">
          <Button variant="soft" size="sm" loading={loadingMore} onClick={onLoadMore}>
            Load more
          </Button>
        </View>
      ) : null}
    </View>
  );
}
