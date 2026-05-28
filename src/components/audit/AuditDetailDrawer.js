import { View, Text, ScrollView, Platform } from "react-native";
import SideModal from "@/components/ui/SideModal";
import Badge from "@/components/ui/Badge";
import { formatDateTime } from "@/utils/format";

// Drawer with the before and after state of one audit entry. JSON is rendered as text, never as HTML.
const block = (value) => (value === null || value === undefined ? "null" : JSON.stringify(value, null, 2));
const MONO = Platform.select({ ios: "Menlo", default: "monospace" });

function JsonBlock({ label, value }) {
  return (
    <View className="gap-[8px]">
      <Text className="text-[13px] font-semibold text-foreground">{label}</Text>
      <ScrollView horizontal className="rounded-[14px] bg-background border border-border">
        <Text selectable className="p-[12px] text-[12.5px] text-foreground" style={{ fontFamily: MONO }}>
          {block(value)}
        </Text>
      </ScrollView>
    </View>
  );
}

export default function AuditDetailDrawer({ open, onClose, entry }) {
  return (
    <SideModal
      open={open}
      onClose={onClose}
      title="Audit entry"
      subtitle={entry ? `${entry.actorName || "System"} · ${formatDateTime(entry.at)}` : undefined}
    >
      {entry ? (
        <View className="gap-[16px]">
          <View className="flex-row flex-wrap items-center gap-[10px]">
            <Badge tone="plain">{entry.action}</Badge>
            {entry.targetType ? <Text className="text-muted">{entry.targetType}</Text> : null}
            {entry.targetName ? <Text className="font-semibold text-foreground">{entry.targetName}</Text> : null}
          </View>
          <JsonBlock label="Before" value={entry.before} />
          <JsonBlock label="After" value={entry.after} />
        </View>
      ) : null}
    </SideModal>
  );
}
