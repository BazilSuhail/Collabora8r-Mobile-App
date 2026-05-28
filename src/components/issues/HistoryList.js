import { Text, View } from "react-native";
import { getHistory } from "@/libs/api/issues";
import { relativeTime } from "@/utils/format";
import { usePaged } from "@/utils/usePaged";
import EmptyState from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import Skeleton from "@/components/ui/Skeleton";

// Shows a field value that may arrive as a string, number, null or an object with a name.
const show = (value) => {
  if (value === null || value === undefined || value === "") return "none";
  if (typeof value === "object") return value.name ?? value.displayName ?? value.key ?? "none";
  return String(value);
};

// Issue change history, newest first. Entries: { id, field, from, to, actor, createdAt }.
export function IssueHistory({ projectId, issueId }) {
  const h = usePaged((p) => getHistory(projectId, issueId, p), { projectId, issueId });
  return <HistoryList items={h.items} status={h.status} onRetry={h.reload} />;
}

export default function HistoryList({ items = [], status = "success", onRetry }) {
  if (status === "loading") return <Skeleton variant="feed" count={4} />;
  if (status === "error") {
    return <EmptyState tone="error" title="Could not load history" onRetry={onRetry} />;
  }
  if (!items.length) return <EmptyState icon="history" title="No changes yet" />;

  return (
    <View className="gap-[2px]" accessibilityLabel="Issue history">
      {items.map((h) => {
        const who = h.actor?.displayName ?? h.actorName ?? "Someone";
        const field = h.field ?? h.type ?? "a field";
        const from = h.from ?? h.fromValue;
        const to = h.to ?? h.toValue;
        const change = from !== undefined || to !== undefined ? `${show(from)} to ${show(to)}` : null;
        return (
          <View key={h.id ?? h._id} className="flex-row items-start gap-[12px] py-[10px] border-b border-border">
            <View className="h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[12px] border border-border bg-surface-2">
              <Icon name="history" size={18} />
            </View>
            <View className="min-w-0 flex-1 gap-[2px]">
              <Text className="text-[13.5px] text-foreground">
                <Text className="font-bold">{who}</Text> changed <Text className="font-bold">{field}</Text>
                {change ? <Text className="text-muted"> from {change}</Text> : null}
              </Text>
              <Text className="text-muted text-[12px] font-semibold">{relativeTime(h.createdAt ?? h.at)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
