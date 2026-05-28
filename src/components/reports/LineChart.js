import { useEffect, useId, useState } from "react";
import { View, Text, AccessibilityInfo } from "react-native";
import Svg, { Defs, LinearGradient, Stop, ClipPath, Rect, G, Line, Path, Circle, Text as SvgText } from "react-native-svg";
import Animated, { useSharedValue, useAnimatedProps, withDelay, withTiming, Easing } from "react-native-reanimated";
import { useChartColors, toneColor } from "./tones";

export const PAD = { l: 44, r: 12, t: 12, b: 26 };

// Rounds a maximum up to a readable axis top.
export function niceMax(v) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return ([1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => n <= s) ?? 10) * p;
}

// Smooth path through points, with control points clamped to each segment.
function curve(pts) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const prev = pts[i - 1] ?? pts[i];
    const a = pts[i];
    const b = pts[i + 1];
    const next = pts[i + 2] ?? b;
    const k = 0.18;
    const c1 = [a[0] + (b[0] - prev[0]) * k, a[1] + (b[1] - prev[1]) * k];
    const c2 = [b[0] - (next[0] - a[0]) * k, b[1] - (next[1] - a[1]) * k];
    const lo = Math.min(a[1], b[1]);
    const hi = Math.max(a[1], b[1]);
    c1[1] = Math.max(lo, Math.min(hi, c1[1]));
    c2[1] = Math.max(lo, Math.min(hi, c2[1]));
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${b[0]},${b[1]}`;
  }
  return d;
}

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const TIP_W = 170;

// Multi-series line chart. series: [{ name, tone, values, dashed? }], values align with labels.
// Drag across the chart to scrub; a tooltip shows the values at that point.
export default function LineChart({ label, labels = [], series = [], height = 220, format = String }) {
  const colors = useChartColors();
  const [w, setW] = useState(0);
  const [hover, setHover] = useState(-1);
  const slug = useId().replace(/\W/g, "");
  const n = labels.length;
  const values = series.map((s) => s.values ?? []);
  const max = niceMax(Math.max(1, ...values.flat().map((v) => v ?? 0)) * 1.08);
  const iw = Math.max(1, w - PAD.l - PAD.r);
  const x = (i) => PAD.l + (n < 2 ? 0 : (i / (n - 1)) * iw);
  const y = (v) => PAD.t + (1 - v / max) * (height - PAD.t - PAD.b);
  const stride = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 56))));
  const shown = (i) => i % stride === 0 || i === n - 1;

  // Draw-in: the clip grows left to right. Reduced motion paints the full width at once.
  const reveal = useSharedValue(0);
  useEffect(() => {
    if (!w) return undefined;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (cancelled) return;
        if (reduced) {
          reveal.value = 1;
          return;
        }
        reveal.value = 0;
        reveal.value = withDelay(300, withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }));
      })
      .catch(() => {
        reveal.value = 1;
      });
    return () => {
      cancelled = true;
    };
  }, [w, n]);
  const clipProps = useAnimatedProps(() => ({ width: PAD.l + (w - PAD.l) * reveal.value + 2 }));

  const pick = (locationX) => {
    if (n < 1) return;
    const i = Math.round(((locationX - PAD.l) / iw) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  const step = (dir) => {
    const from = hover < 0 ? n - 1 : hover;
    setHover(Math.max(0, Math.min(n - 1, from + dir)));
  };

  const line = (vals) => curve(vals.map((v, i) => [x(i), y(v ?? 0)]));
  const first = series[0]?.tone ?? "ember";
  const firstColor = toneColor(colors, first);
  const tipTop = hover >= 0 ? Math.max(0, y(Math.max(...values.map((v) => v[hover] ?? 0))) - 64) : 0;
  const tipLeft = hover >= 0 ? Math.min(Math.max(0, w - TIP_W), Math.max(4, x(hover) - 60)) : 0;

  return (
    <View
      className="relative w-full"
      style={{ height }}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={
        hover >= 0
          ? { text: `${labels[hover]}: ${series.map((s, i) => `${s.name} ${format(values[i][hover] ?? 0)}`).join(", ")}` }
          : undefined
      }
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === "increment" ? 1 : -1)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(e) => pick(e.nativeEvent.locationX)}
      onResponderMove={(e) => pick(e.nativeEvent.locationX)}
      onResponderRelease={() => setHover(-1)}
      onResponderTerminate={() => setHover(-1)}
    >
      {w > 0 ? (
        <Svg width={w} height={height} viewBox={`0 0 ${w} ${height}`}>
          <Defs>
            <LinearGradient id={`g-${slug}`} x1="0" x2="0" y1="0" y2="1">
              <Stop offset="0" stopColor={firstColor} stopOpacity={0.22} />
              <Stop offset="1" stopColor={firstColor} stopOpacity={0} />
            </LinearGradient>
            <ClipPath id={`c-${slug}`}>
              <AnimatedRect x="0" y="0" height={height} animatedProps={clipProps} />
            </ClipPath>
          </Defs>
          <G>
            {[0, 0.5, 1].map((f) => (
              <G key={f}>
                <Line x1={PAD.l} x2={w - PAD.r} y1={y(max * f)} y2={y(max * f)} stroke={colors.line} strokeWidth={1} />
                <SvgText x={PAD.l - 8} y={y(max * f) + 4} textAnchor="end" fontSize={11} fill={colors.textMuted}>
                  {format(max * f)}
                </SvgText>
              </G>
            ))}
          </G>
          <G clipPath={`url(#c-${slug})`}>
            {values[0] && n > 1 ? (
              <Path
                fill={`url(#g-${slug})`}
                d={`${line(values[0])} L${x(n - 1)},${height - PAD.b} L${x(0)},${height - PAD.b} Z`}
              />
            ) : null}
            {series.map((s, i) => (
              <Path
                key={s.name}
                d={line(values[i])}
                fill="none"
                stroke={toneColor(colors, s.tone)}
                strokeWidth={2.25}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={s.dashed ? "5 5" : undefined}
              />
            ))}
          </G>
          <G>
            {labels.map((l, i) =>
              shown(i) ? (
                <SvgText key={i} x={x(i)} y={height - 6} textAnchor="middle" fontSize={11} fill={colors.textMuted}>
                  {String(l)}
                </SvgText>
              ) : null,
            )}
          </G>
          {hover >= 0 ? (
            <G>
              <Line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={height - PAD.b} stroke={colors.textMuted} strokeWidth={1} strokeDasharray="3 3" />
              {values.map((v, i) => (
                <Circle
                  key={series[i].name}
                  cx={x(hover)}
                  cy={y(v[hover] ?? 0)}
                  r="4.5"
                  fill={toneColor(colors, series[i].tone)}
                  stroke={colors.surface}
                  strokeWidth={2}
                />
              ))}
            </G>
          ) : null}
        </Svg>
      ) : null}
      {hover >= 0 ? (
        <View
          pointerEvents="none"
          className="absolute rounded-[10px] border border-border bg-surface px-[10px] py-[8px] gap-[2px]"
          style={{ left: tipLeft, top: tipTop, maxWidth: TIP_W }}
        >
          <Text className="text-[12.5px] font-bold text-foreground">{labels[hover]}</Text>
          {series.map((s, i) => (
            <View key={s.name} className="flex-row items-center gap-[6px]">
              <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: toneColor(colors, s.tone) }} />
              <Text className="text-[12px] text-muted">
                {s.name} <Text className="font-bold text-foreground">{format(values[i][hover] ?? 0)}</Text>
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
