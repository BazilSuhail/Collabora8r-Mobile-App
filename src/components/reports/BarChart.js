import { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming, Easing } from "react-native-reanimated";
import { useChartColors, toneColor } from "./tones";

function Bar({ pct, color, index, version }) {
  const grow = useSharedValue(0);
  useEffect(() => {
    grow.value = 0;
    grow.value = withDelay(200 + index * 50, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [version]);
  const style = useAnimatedStyle(() => ({ height: `${pct * grow.value}%` }));
  return <Animated.View style={[{ width: "100%", borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: color }, style]} />;
}

// Vertical bars. values align with labels; tone picks the series colour token.
export default function BarChart({ label, labels = [], values = [], tone = "ember", height = 220, format = String }) {
  const colors = useChartColors();
  const max = Math.max(1, ...values);
  const trackH = Math.max(40, height - 26);
  const version = values.join(",");
  const summary = values.map((v, i) => `${labels[i]}: ${format(v)}`).join(", ");

  return (
    <View
      className="flex-row items-stretch gap-[8px] w-full"
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${label ?? ""}${summary ? `. ${summary}` : ""}`}
      style={{ height }}
    >
      {values.map((v, i) => (
        <View key={`${labels[i]}-${i}`} className="flex-1 min-w-0 gap-[6px]">
          <View className="justify-end" style={{ height: trackH }}>
            <Bar pct={Math.max(2, (v / max) * 100)} color={toneColor(colors, tone)} index={i} version={version} />
          </View>
          <Text className="text-muted text-[11px] font-semibold text-center" numberOfLines={1}>
            {labels[i]}
          </Text>
        </View>
      ))}
    </View>
  );
}
