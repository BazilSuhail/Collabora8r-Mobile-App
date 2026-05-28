import { View, Text } from "react-native";
import EmptyState from "@/components/ui/EmptyState";

// Card shell for one chart or widget. Renders its own loading, error and empty states.
// status: loading | error | success. empty: true when the success data has nothing to draw.
// `area` (web grid placement) is accepted but ignored: cards stack in one column on phones.
export default function ReportCard({
  id,
  title,
  sub,
  tools,
  status = "success",
  error,
  empty = false,
  emptyTitle = "Not enough data yet",
  emptyText,
  onRetry,
  height = 220,
  area: _area,
  className,
  children,
}) {
  let body = children;
  if (status === "loading") {
    body = (
      <View
        className="bg-background rounded-[12px] w-full opacity-70"
        style={{ height }}
        accessibilityState={{ busy: true }}
        accessibilityLabel="Loading"
      />
    );
  } else if (status === "error") {
    body = (
      <EmptyState
        tone="error"
        title="Could not load this report"
        text={error?.message ?? "Try again in a moment."}
        onRetry={onRetry}
      />
    );
  } else if (empty) {
    body = <EmptyState title={emptyTitle} text={emptyText} />;
  }

  return (
    <View
      nativeID={id}
      className={`flex-col min-w-0 p-[18px] gap-[14px] rounded-[18px] border border-border bg-surface ${className ?? ""}`}
    >
      <View className="flex-row items-start gap-[12px] min-w-0">
        <View className="min-w-0 flex-1">
          <Text accessibilityRole="header" className="text-[16px] font-bold text-foreground">
            {title}
          </Text>
          {sub ? <Text className="text-[13px] text-muted mt-[2px]">{sub}</Text> : null}
        </View>
        {tools ? <View className="shrink-0">{tools}</View> : null}
      </View>
      {body}
    </View>
  );
}
