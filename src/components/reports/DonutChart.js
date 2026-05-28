import { useEffect } from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, { useSharedValue, useAnimatedProps, withDelay, withTiming, Easing } from "react-native-reanimated";
import { useChartColors, toneColor } from "./tones";

const R = 52;
const C = 2 * Math.PI * R;
// Series order from the chart tokens: ember, iris, spruce, saffron, ink, faint (the shell tone name for faint is muted).
export const DONUT_TONES = ["ember", "iris", "spruce", "saffron", "ink", "muted"];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function Arc({ len, offset, color, index, version }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = 0;
    p.value = withDelay(200 + index * 120, withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.cubic) }));
  }, [version]);
  const animatedProps = useAnimatedProps(() => ({ strokeDasharray: `${len * p.value} ${C}` }));
  return (
    <AnimatedCircle
      cx="70"
      cy="70"
      r={R}
      fill="none"
      stroke={color}
      strokeWidth={16}
      strokeDashoffset={-offset}
      animatedProps={animatedProps}
      transform="rotate(-90 70 70)"
    />
  );
}

// parts: [{ label, value }]. Colours follow DONUT_TONES in order.
export default function DonutChart({ label, parts = [], centerValue, centerLabel, format = String }) {
  const colors = useChartColors();
  const total = parts.reduce((n, p) => n + p.value, 0) || 1;
  let offset = 0;
  const arcs = parts.map((p, i) => {
    const len = (p.value / total) * C;
    const arc = { ...p, tone: DONUT_TONES[i % DONUT_TONES.length], len, offset };
    offset += len;
    return arc;
  });
  const version = parts.map((p) => p.value).join(",");

  return (
    <View className="gap-[20px]">
      <View
        className="self-center items-center justify-center"
        style={{ width: 160, height: 160 }}
        accessible
        accessibilityRole="image"
        accessibilityLabel={label}
      >
        <Svg width={160} height={160} viewBox="0 0 140 140" style={{ position: "absolute" }}>
          <Circle cx="70" cy="70" r={R} fill="none" stroke={colors.well} strokeWidth={16} />
          {arcs.map((a, i) => (
            <Arc key={`${a.label}-${i}`} len={a.len} offset={a.offset} color={toneColor(colors, a.tone)} index={i} version={version} />
          ))}
        </Svg>
        <Text className="text-[22px] font-bold text-foreground">{centerValue}</Text>
        {centerLabel ? <Text className="text-[12px] text-muted">{centerLabel}</Text> : null}
      </View>
      <View className="gap-[10px] min-w-0">
        {arcs.map((a, i) => (
          <View key={`${a.label}-${i}`} className="flex-row items-center gap-[10px] min-w-0">
            <View className="w-[10px] h-[10px] rounded-[3px]" style={{ backgroundColor: toneColor(colors, a.tone) }} />
            <Text className="font-bold text-foreground min-w-0 flex-1" numberOfLines={1}>
              {a.label}
            </Text>
            <Text className="font-bold text-foreground" style={{ fontVariant: ["tabular-nums"] }}>
              {format(a.value)}
            </Text>
            <Text className="text-muted text-[12px]">{Math.round((a.value / total) * 100)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
