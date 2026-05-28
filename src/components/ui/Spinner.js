import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { cn } from './cn';
import { useThemeColor } from './useThemeColor';

const PX = { sm: 16, md: 20, lg: 28 };

function useLoop(duration) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let loop;
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (!alive || reduced) return;
        loop = Animated.loop(
          Animated.timing(v, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
        );
        loop.start();
      })
      .catch(() => {});
    return () => {
      alive = false;
      loop?.stop();
    };
  }, [v, duration]);
  return v;
}

function Dots({ className, label, ...rest }) {
  const t = useLoop(900);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      className={cn('flex-row gap-[4px] items-center', className)}
      {...rest}
    >
      {[0, 1, 2].map((i) => (
        <Animated.View
          key={i}
          className="rounded-full bg-faint w-[6px] h-[6px]"
          style={{
            opacity: t.interpolate({
              inputRange: [0, (i + 0.5) / 3, 1],
              outputRange: [0.35, 1, 0.35],
            }),
          }}
        />
      ))}
    </View>
  );
}

// tone "current" takes `color` from the caller (RN has no currentColor inheritance).
export default function Spinner({
  size = 'md',
  tone = 'ember',
  label = 'Loading',
  variant = 'ring',
  color,
  className,
  ...rest
}) {
  const track = useThemeColor('line-2');
  const ember = useThemeColor('ember');
  const fg = useThemeColor('foreground');
  const spin = useLoop(800);
  if (variant === 'dots') return <Dots className={className} label={label} {...rest} />;
  const px = PX[size] ?? PX.md;
  const arc = color ?? (tone === 'current' ? fg : ember);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      className={cn('shrink-0', className)}
      {...rest}
    >
      <Animated.View style={{ width: px, height: px, transform: [{ rotate }] }}>
        <Svg viewBox="0 0 24 24" width={px} height={px}>
          <Circle cx="12" cy="12" r="9" fill="none" strokeWidth="3.5" stroke={track} />
          <Circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="14 60"
            stroke={arc}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}
