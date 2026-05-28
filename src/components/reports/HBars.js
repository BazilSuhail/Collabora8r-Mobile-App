import { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming, Easing } from "react-native-reanimated";
import { useChartColors, toneColor } from "./tones";

function Fill({ pct, color, index, version }) {
  const grow = useSharedValue(0);
  useEffect(() => {
    grow.value = 0;
    grow.value = withDelay(200 + index * 80, withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) }));
  }, [version]);
  const style = useAnimatedStyle(() => ({ width: `${pct * grow.value}%` }));
  return <Animated.View style={[{ height: "100%", borderRadius: 999, backgroundColor: color }, style]} />;
}

// Horizontal bars. rows: [{ key, label, value, valueText?, tone? }]. Bars scale to the largest value.
export default function HBars({ label, rows = [] }) {
  const colors = useChartColors();
  const max = Math.max(1, ...rows.map((r) => r.value));
  const version = rows.map((r) => `${r.key}:${r.value}`).join("|");

  return (
    <View className="gap-[12px]" accessibilityRole="list" accessibilityLabel={label}>
      {rows.map((r, i) => (
        <View key={r.key} className="gap-[6px]" accessible accessibilityLabel={`${r.label}: ${r.valueText ?? r.value}`}>
          <View className="flex-row items-baseline justify-between gap-[10px]">
            <Text className="flex-1 text-[13.5px] text-foreground" numberOfLines={1}>
              {r.label}
            </Text>
            <Text className="text-[13.5px] font-bold text-foreground" style={{ fontVariant: ["tabular-nums"] }}>
              {r.valueText ?? r.value}
            </Text>
          </View>
          <View className="h-[8px] w-full overflow-hidden rounded-full" style={{ backgroundColor: colors.well }}>
            <Fill pct={(r.value / max) * 100} color={toneColor(colors, r.tone ?? "iris")} index={i} version={version} />
          </View>
        </View>
      ))}
    </View>
  );
}
