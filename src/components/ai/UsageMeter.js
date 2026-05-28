import { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";

// Daily AI calls used against the server limit, plus this month's count.
export default function UsageMeter({ usage }) {
  const limit = Number(usage?.dailyLimit ?? 0);
  const today = Number(usage?.today?.calls ?? 0);
  const month = Number(usage?.month?.calls ?? 0);
  const ratio = limit > 0 ? Math.min(today / limit, 1) : 0;
  const atLimit = limit > 0 && today >= limit;

  const fill = useSharedValue(0);
  useEffect(() => {
    fill.value = 0;
    fill.value = withTiming(ratio, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [ratio]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  return (
    <View className="gap-[10px]">
      <View className="flex-row flex-wrap items-baseline justify-between gap-[8px]">
        <Text className="text-[14px] font-semibold text-foreground">Today</Text>
        <Text
          className={`text-[14px] ${atLimit ? "font-semibold text-danger" : "text-muted"}`}
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {limit > 0 ? `${today} of ${limit} AI calls` : `${today} AI calls`}
          {atLimit ? " · limit reached" : ""}
        </Text>
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Daily AI calls used"
        accessibilityValue={{ min: 0, max: limit > 0 ? limit : today, now: today }}
        className="h-[8px] w-full overflow-hidden rounded-full bg-background border border-border"
      >
        <Animated.View className={`h-full rounded-full ${atLimit ? "bg-danger" : "bg-success"}`} style={fillStyle} />
      </View>
      <Text className="text-[13px] text-muted" style={{ fontVariant: ["tabular-nums"] }}>
        This month: {month} AI calls
      </Text>
    </View>
  );
}
