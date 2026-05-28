import { View, Text } from "react-native";
import Button from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { relativeTime } from "@/utils/format";

const KIND_ICON = {
  mention: "mention",
  assigned: "userCheck",
  commented: "chat",
  statusChanged: "workflow",
  dueSoon: "calendar",
  overdue: "alert",
  approval: "approval",
  slaBreach: "sla",
  invite: "mail",
  joinDecision: "userCheck",
  achievement: "trophy",
  digest: "inbox",
};

// Rows for the notifications drawer and screen. Unread rows get a dot and a mark-as-read button.
export default function NotificationList({ items, onRead, busyId }) {
  return (
    <View className="gap-[4px]" accessibilityLabel="Notifications" accessibilityRole="list">
      {(items ?? []).map((n) => {
        const id = n.id ?? n._id;
        const unread = !n.readAt;
        return (
          <View
            key={id}
            className="flex-row items-start gap-[12px] rounded-[14px] p-[12px]"
            accessibilityLabel={unread ? `Unread: ${n.title || n.body}` : undefined}
          >
            <View className="items-center justify-center w-[32px] h-[32px] rounded-[10px] bg-background">
              <Icon name={KIND_ICON[n.kind] ?? "bell"} size={16} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className={`text-[14px] text-foreground ${unread ? "font-bold" : "font-semibold"}`}>
                {n.title || n.body}
              </Text>
              {n.title && n.body ? <Text className="text-[13px] text-muted">{n.body}</Text> : null}
              <Text className="text-[12px] text-muted mt-[2px]">
                {relativeTime(n.createdAt)}
                {n.actorName ? ` · ${n.actorName}` : ""}
              </Text>
            </View>
            {unread ? (
              <>
                <View className="w-[8px] h-[8px] mt-[7px] rounded-full bg-accent" />
                <Button
                  iconOnly
                  variant="ghost"
                  size="sm"
                  icon="check"
                  aria-label="Mark as read"
                  accessibilityLabel="Mark as read"
                  loading={busyId === id}
                  onClick={() => onRead?.(id)}
                />
              </>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
