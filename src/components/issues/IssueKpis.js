import { useEffect, useRef, useState } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import { cn } from "@/utils/cn";
import EmptyState from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import Skeleton from "@/components/ui/Skeleton";

const TONE_TEXT = {
  ember: "text-ember-t",
  iris: "text-iris-t",
  saffron: "text-saffron-t",
  spruce: "text-spruce-t",
};

// Counts up from the last shown value to the new one over about half a second.
function CountValue({ value }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = from.current;
    const target = Number(value) || 0;
    const began = Date.now();
    const duration = 600;
    let frame;
    const step = () => {
      const t = Math.min(1, (Date.now() - began) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = start + (target - start) * eased;
      setShown(Number.isInteger(target) ? Math.round(next) : Math.round(next * 10) / 10);
      if (t < 1) frame = requestAnimationFrame(step);
      else from.current = target;
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return (
    <Text numberOfLines={1} className="text-[26px] font-semibold leading-[1.05] tracking-tight text-foreground" style={{ fontVariant: ["tabular-nums"] }}>
      {shown.toLocaleString()}
    </Text>
  );
}

function KpiTile({ item, width }) {
  const toneText = item.tone && item.tone !== "plain" ? TONE_TEXT[item.tone] : "text-foreground";
  return (
    <View style={{ width }} className="p-[8px]">
      <View className="flex-1 justify-between overflow-hidden rounded-[15px] border border-border bg-surface">
        <View className="gap-[10px] px-[18px] pt-[16px] pb-[14px]">
          <View className="flex-row items-center gap-[10px]">
            <View className="h-[38px] w-[38px] items-center justify-center rounded-[12px] border border-border bg-surface-2">
              <Icon name={item.icon} size={18} className={cn(toneText)} />
            </View>
          </View>
          <Text className="text-[13px] font-semibold text-muted">{item.label}</Text>
          {typeof item.value === "number" ? (
            <CountValue value={item.value} />
          ) : (
            <Text numberOfLines={1} className="text-[26px] font-semibold leading-[1.05] tracking-tight text-foreground" style={{ fontVariant: ["tabular-nums"] }}>
              {item.value}
            </Text>
          )}
        </View>
        {item.sub ? (
          <View className="flex-row items-center justify-between gap-[10px] border-t border-border bg-surface-2 px-[18px] py-[10px]">
            <Text className="text-muted text-[12.5px] font-semibold">{item.sub}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// Counter tiles for a screen head or card row. items: [{ id, label, value, icon, tone?, sub? }].
// value is a number (animated count-up) or a string (shown as is).
// Four columns on wide screens, two on phones.
export default function IssueKpis({ items = [], status = "success", onRetry }) {
  const { width } = useWindowDimensions();
  const cols = width >= 1100 ? 4 : 2;
  if (status === "loading") return <Skeleton variant="kpi" count={items.length || 4} />;
  if (status === "error") {
    return (
      <View className="rounded-[15px] border border-border bg-surface px-[20px] pt-[18px] pb-[20px]">
        <EmptyState tone="error" title="Could not load these numbers" onRetry={onRetry} />
      </View>
    );
  }
  return (
    <View className="flex-row flex-wrap -m-[8px]">
      {items.map((item) => (
        <KpiTile key={item.id} item={item} width={`${100 / cols}%`} />
      ))}
    </View>
  );
}
