import { View, Text, Pressable } from "react-native";
import SideModal from "@/components/ui/SideModal";
import Button from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

// Widget types the dashboard can render. Keys match the server widget enum.
export const WIDGET_TYPES = [
  { type: "stat", label: "Number", text: "One headline count: created, resolved or open items.", icon: "gauge" },
  { type: "lineChart", label: "Created vs resolved", text: "Daily created and resolved items over 90 days.", icon: "chartLine" },
  { type: "barChart", label: "Velocity", text: "Points finished in each closed sprint.", icon: "analytics" },
  { type: "donut", label: "Items by type", text: "How open and closed items split across types.", icon: "pie" },
  { type: "burndown", label: "Burndown", text: "Remaining points against the ideal line for a sprint.", icon: "trendDown" },
  { type: "workload", label: "Workload", text: "Open items per assignee.", icon: "users" },
  { type: "text", label: "Note", text: "A short note for the team.", icon: "edit" },
];

// Sheet that lists widget types. onPick(type) runs when one is chosen.
export default function WidgetPicker({ open, onClose, onPick }) {
  return (
    <SideModal
      open={open}
      onClose={onClose}
      title="Add widget"
      subtitle="Choose what to show on this dashboard."
      footer={
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      }
    >
      <View className="gap-[10px]">
        {WIDGET_TYPES.map((w) => (
          <Pressable
            key={w.type}
            accessibilityRole="button"
            accessibilityLabel={`${w.label}. ${w.text}`}
            onPress={() => onPick?.(w.type)}
            className="flex-row items-start gap-[12px] p-[14px] rounded-[16px] border border-border bg-surface active:opacity-70"
          >
            <View className="w-[36px] h-[36px] items-center justify-center rounded-[10px] bg-background">
              <Icon name={w.icon} size={18} />
            </View>
            <View className="flex-1 gap-[2px] min-w-0">
              <Text className="font-bold text-foreground">{w.label}</Text>
              <Text className="text-[13px] text-muted">{w.text}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </SideModal>
  );
}
