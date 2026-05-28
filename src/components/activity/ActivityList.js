import { View, Text } from "react-native";
import Avatar from "@/components/ui/Avatar";
import { relativeTime } from "@/utils/format";

const KIND_TEXT = {
  issueCreated: "created",
  issueUpdated: "updated",
  statusChanged: "moved",
  commentAdded: "commented on",
  sprintStarted: "started a sprint",
  sprintClosed: "closed a sprint",
  memberAdded: "added a member",
  memberRemoved: "removed a member",
  releaseShipped: "shipped a release",
  pageUpdated: "updated a wiki page",
};

// Project activity feed rows. Read only.
export default function ActivityList({ items }) {
  return (
    <View className="gap-[4px]" accessibilityLabel="Recent activity" accessibilityRole="list">
      {(items ?? []).map((a) => {
        const id = a.id ?? a._id ?? `${a.at}-${a.kind}-${a.itemKey ?? ""}`;
        return (
          <View key={id} className="flex-row items-start gap-[12px] rounded-[14px] p-[12px]">
            <Avatar name={a.actorName ?? "Someone"} src={a.actorAvatar} size="sm" />
            <View className="min-w-0 flex-1">
              <Text className="text-[14px] text-foreground">
                <Text className="font-semibold">{a.actorName ?? "Someone"}</Text> {a.summary ?? KIND_TEXT[a.kind] ?? "changed"}
                {a.itemKey ? ` ${a.itemKey}` : ""}
              </Text>
              {a.itemTitle ? (
                <Text className="text-[13px] text-muted" numberOfLines={1}>
                  {a.itemTitle}
                </Text>
              ) : null}
              <Text className="text-[12px] text-muted mt-[2px]">{relativeTime(a.at)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
