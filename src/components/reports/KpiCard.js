import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { useChartColors, toneColor } from "./tones";

// Counts a number up from zero over ~0.9s with an ease-out curve.
function useCountUp(value, enabled) {
  const [shown, setShown] = useState(enabled ? 0 : value);
  useEffect(() => {
    if (!enabled) return undefined;
    let frame;
    const startAt = Date.now();
    const duration = 900;
    const tick = () => {
      const t = Math.min(1, (Date.now() - startAt) / duration);
      const eased = 1 - (1 - t) ** 3;
      const next = value * eased;
      setShown(Number.isInteger(value) ? Math.round(next) : next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, enabled]);
  return shown;
}

// KPI tile. Numeric values count up from zero; text values render as given.
export default function KpiCard({ tone = "ember", icon, label, value, format = String, foot }) {
  const colors = useChartColors();
  const numeric = typeof value === "number";
  const shown = useCountUp(numeric ? value : 0, numeric);
  const color = toneColor(colors, tone);

  return (
    <View className="rounded-[16px] border border-border bg-surface p-[16px] gap-[10px]">
      <View className="gap-[8px]">
        <View
          className="w-[36px] h-[36px] items-center justify-center rounded-[10px]"
          style={{ backgroundColor: colors.well }}
        >
          <Icon name={icon} size={18} color={color} />
        </View>
        <Text className="text-[13px] font-semibold text-muted">{label}</Text>
        <Text className="text-[28px] font-bold text-foreground" style={{ fontVariant: ["tabular-nums"] }}>
          {numeric ? format(shown) : value}
        </Text>
      </View>
      {foot ? (
        <View className="border-t border-border pt-[8px]">
          <Text className="text-[12.5px] font-semibold text-muted">{foot}</Text>
        </View>
      ) : null}
    </View>
  );
}
