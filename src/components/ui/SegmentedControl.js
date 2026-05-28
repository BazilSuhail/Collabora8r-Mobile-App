import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { cn } from './cn';
import { Icon } from './Icon';
import { useThemeColor } from './useThemeColor';

export default function SegmentedControl({
  value,
  onChange,
  options = [],
  label,
  size = 'md',
  as = 'buttons',
  className,
  ...rest
}) {
  const isTabs = as === 'tabs';
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const [layouts, setLayouts] = useState({});
  const x = useRef(new Animated.Value(0)).current;
  const w = useRef(new Animated.Value(0)).current;
  const placed = useRef(false);
  const shadow = useThemeColor('shadow');

  useEffect(() => {
    const l = layouts[activeIndex];
    if (!l) return;
    if (!placed.current) {
      x.setValue(l.x);
      w.setValue(l.width);
      placed.current = true;
      return;
    }
    Animated.parallel([
      Animated.spring(x, { toValue: l.x, useNativeDriver: false, friction: 9, tension: 90 }),
      Animated.spring(w, { toValue: l.width, useNativeDriver: false, friction: 9, tension: 90 }),
    ]).start();
  }, [activeIndex, layouts, x, w]);

  const sm = size === 'sm';
  const hasPill = Boolean(layouts[activeIndex]);

  return (
    <View
      accessibilityRole={isTabs ? 'tablist' : undefined}
      accessibilityLabel={label}
      className={cn('flex-row self-start bg-well rounded-[12px] p-[3px]', className)}
      {...rest}
    >
      <Animated.View
        pointerEvents="none"
        className="absolute top-[3px] bottom-[3px] rounded-[10px] bg-seg-pill"
        style={{
          left: x,
          width: w,
          opacity: hasPill ? 1 : 0,
          shadowColor: shadow,
          shadowOpacity: 0.08,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        }}
      />
      {options.map((o, i) => {
        const active = o.value === value;
        const fg = active ? 'text-foreground' : 'text-muted';
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole={isTabs ? 'tab' : 'button'}
            accessibilityState={{ selected: active }}
            onLayout={(e) => {
              const { x: lx, width } = e.nativeEvent.layout;
              setLayouts((prev) =>
                prev[i] && prev[i].x === lx && prev[i].width === width ? prev : { ...prev, [i]: { x: lx, width } },
              );
            }}
            onPress={() => onChange?.(o.value)}
            className={cn(
              'flex-row items-center gap-[6px] rounded-[10px] min-h-[36px]',
              sm ? 'px-[10px] py-[5px]' : 'px-[13px] py-[7px]',
            )}
          >
            {o.icon ? <Icon name={o.icon} size={15} cls={fg} /> : null}
            <Text className={cn('font-sans-bold', sm ? 'text-[12px]' : 'text-[12.5px]', fg)} numberOfLines={1}>
              {o.label}
            </Text>
            {o.count != null ? (
              <Text className={cn('text-faint font-sans-bold', sm ? 'text-[12px]' : 'text-[12.5px]')}>{o.count}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
