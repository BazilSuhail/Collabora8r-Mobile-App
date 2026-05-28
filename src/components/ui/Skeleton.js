import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, View } from 'react-native';
import { cn } from './cn';

const CELL_WIDTHS = ['55%', '35%', '45%', '25%', '40%', '30%', '50%', '20%'];

// One pulse shared by every block of a Skeleton.
function usePulse() {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let loop;
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (!alive || reduced) return;
        loop = Animated.loop(
          Animated.sequence([
            Animated.timing(v, { toValue: 0.5, duration: 800, useNativeDriver: true }),
            Animated.timing(v, { toValue: 1, duration: 800, useNativeDriver: true }),
          ]),
        );
        loop.start();
      })
      .catch(() => {});
    return () => {
      alive = false;
      loop?.stop();
    };
  }, [v]);
  return v;
}

function Block({ pulse, className, width, height, round }) {
  return (
    <Animated.View
      className={cn('bg-well', round ? 'rounded-full' : 'rounded-[12px]', className)}
      style={{ opacity: pulse, width, height }}
    />
  );
}

// Same variants as the client. "rows" renders list-row placeholders (no tables on mobile).
export default function Skeleton({ variant = 'rows', count = 6, cols = 4 }) {
  const pulse = usePulse();
  const n = Math.max(1, count);
  const busy = { accessibilityState: { busy: true }, accessibilityLabel: 'Loading' };

  if (variant === 'rows') {
    const c = Math.max(1, Math.min(cols, 3));
    return (
      <View {...busy}>
        {Array.from({ length: n }, (_, r) => (
          <View key={r} className="flex-row items-center gap-[12px] px-[16px] py-[14px] border-b border-line">
            {Array.from({ length: c }, (_, i) => (
              <View key={i} className={i === 0 ? 'flex-[2]' : 'flex-1'}>
                <Block pulse={pulse} height={12} width={CELL_WIDTHS[(i + r) % CELL_WIDTHS.length]} />
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  }

  if (variant === 'feed') {
    return (
      <View className="gap-[14px]" {...busy}>
        {Array.from({ length: n }, (_, i) => (
          <View className="flex-row gap-[12px] items-start" key={i}>
            <Block pulse={pulse} width={28} height={28} round />
            <View className="gap-[6px] flex-1 min-w-0">
              <Block pulse={pulse} height={12} width="70%" />
              <Block pulse={pulse} height={10} width="30%" />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (variant === 'kpi') {
    return (
      <View className="flex-row flex-wrap gap-gap" {...busy}>
        {Array.from({ length: n }, (_, i) => (
          <View
            className="bg-surface border border-line rounded-card gap-[10px] p-[18px] grow basis-[45%] min-w-[150px]"
            key={i}
          >
            <Block pulse={pulse} height={12} width="45%" />
            <Block pulse={pulse} height={28} width="60%" />
            <Block pulse={pulse} height={10} width="35%" />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View className="gap-gap" {...busy}>
      {Array.from({ length: n }, (_, i) => (
        <View className="bg-surface border border-line rounded-card gap-[10px] p-[18px]" key={i}>
          <Block pulse={pulse} height={14} width="60%" />
          <Block pulse={pulse} height={12} width="40%" />
        </View>
      ))}
    </View>
  );
}
