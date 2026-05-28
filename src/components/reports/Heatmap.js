import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useChartColors } from "./tones";

const DAY = 864e5;
const dayKey = (t) => new Date(t).toISOString().slice(0, 10);
const GAP = 3;
const LEVEL_ALPHA = { 1: 0.25, 2: 0.5, 3: 0.75, 4: 1 };

function hexToRgba(hex, a) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function cellColor(colors, level) {
  if (level === "f") return "transparent";
  if (!level) return colors.well;
  return hexToRgba(colors.spruce, LEVEL_ALPHA[level]);
}

// Calendar heatmap: weeks columns of 7 rows (Monday first). days: [{ date: "YYYY-MM-DD", value }].
// Tap a cell to see its date and value (the web has no tooltip; touch needs one).
export default function Heatmap({ label, days = [], weeks = 13 }) {
  const colors = useChartColors();
  const [width, setWidth] = useState(0);
  const [picked, setPicked] = useState(null);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayMs = today.getTime();
  const mondayOffset = (today.getUTCDay() + 6) % 7;
  const start = todayMs - (mondayOffset + (weeks - 1) * 7) * DAY;
  const byDay = new Map(days.map((d) => [d.date, d.value]));
  const peak = Math.max(0, ...days.map((d) => d.value));
  const total = days.reduce((n, d) => n + d.value, 0);

  const cells = Array.from({ length: weeks * 7 }, (_, i) => {
    const t = start + i * DAY;
    const key = dayKey(t);
    const value = byDay.get(key) ?? 0;
    let level;
    if (t > todayMs) level = "f";
    else if (value <= 0 || peak <= 0) level = 0;
    else level = Math.min(4, Math.max(1, Math.ceil((value / peak) * 4)));
    return { i, level, key, value };
  });

  const columns = Array.from({ length: weeks }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  const size = width ? Math.max(6, Math.floor((width - GAP * (weeks - 1)) / weeks)) : 0;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`${label}: ${total} in ${weeks} weeks`}>
      <View className="flex-row" style={{ gap: GAP }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {size
          ? columns.map((col, w) => (
              <View key={w} style={{ gap: GAP }}>
                {col.map((c) => (
                  <Pressable
                    key={c.i}
                    disabled={c.level === "f"}
                    onPress={() => setPicked(picked?.i === c.i ? null : c)}
                    style={{
                      width: size,
                      height: size,
                      borderRadius: 3,
                      backgroundColor: cellColor(colors, c.level),
                      borderWidth: picked?.i === c.i ? 1.5 : c.level === "f" ? 1 : 0,
                      borderColor: picked?.i === c.i ? colors.text : colors.line,
                    }}
                  />
                ))}
              </View>
            ))
          : null}
      </View>
      {picked ? (
        <Text className="mt-[8px] text-[12.5px] text-foreground">
          {picked.key}: {picked.value}
        </Text>
      ) : null}
      <View className="mt-[12px] flex-row items-center gap-[4px]">
        <Text className="text-[12px] text-muted mr-[2px]">Less</Text>
        {[0, 1, 2, 3, 4].map((l) => (
          <View key={l} style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: cellColor(colors, l) }} />
        ))}
        <Text className="text-[12px] text-muted ml-[2px]">More</Text>
      </View>
    </View>
  );
}
