import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from './cn';
import { Icon } from './Icon';
import { useThemeColor } from './useThemeColor';

const CHIP = {
  success: ['bg-spruce', 'on-spruce'],
  error: ['bg-ember', 'on-ember'],
  warning: ['bg-saffron', 'on-saffron'],
  info: ['bg-iris', 'on-iris'],
};
const TYPE_ICON = {
  success: 'check',
  error: 'alert',
  warning: 'flag',
  info: 'info',
};

const depthOpacity = (depth) => 1 - 0.12 * depth;
const depthScale = (depth) => 1 - 0.03 * depth;

// Clears the bottom tab bar (the web's w760 offset was 86px).
export const TOAST_BOTTOM_OFFSET = 72;

// One toast. Enters with a spring, sits behind newer toasts with a depth
// scale, and fades out. onGone fires once the exit is done, so the provider
// can remove it and shift the stack.
export function ToastItem({ item, depth, onDismiss, onGone, onPressIn, onPressOut }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(18)).current;
  const scale = useRef(new Animated.Value(0.96)).current;
  const [chipBg, chipFg] = CHIP[item.type] ?? CHIP.info;
  const chipColor = useThemeColor(chipFg);
  const onInk = useThemeColor('on-ink');
  const shadow = useThemeColor('shadow');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: depthOpacity(depth), duration: 220, useNativeDriver: true }),
      Animated.spring(y, { toValue: 0, friction: 6, tension: 90, useNativeDriver: true }),
      Animated.spring(scale, { toValue: depthScale(depth), friction: 6, tension: 90, useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (item.leaving) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: depthOpacity(depth), duration: 300, useNativeDriver: true }),
      Animated.timing(scale, { toValue: depthScale(depth), duration: 300, useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depth]);

  useEffect(() => {
    if (!item.leaving) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(y, { toValue: 10, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start(() => onGone(item.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.leaving]);

  return (
    <Animated.View
      style={{ opacity, transform: [{ translateY: y }, { scale }] }}
      accessibilityLiveRegion={item.type === 'error' ? 'assertive' : 'polite'}
    >
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        className="flex-row items-center gap-[10px] pt-[10px] pr-[8px] pb-[10px] pl-[14px] rounded-[14px] bg-ink"
        style={{
          shadowColor: shadow,
          shadowOpacity: 0.25,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 10 },
          elevation: 10,
        }}
      >
        <View className={cn('items-center justify-center w-[18px] h-[18px] rounded-full shrink-0', chipBg)}>
          <Icon name={item.icon ?? TYPE_ICON[item.type] ?? 'info'} size={12} color={chipColor} strokeWidth={2.4} />
        </View>
        <Text className="flex-1 min-w-0 text-on-ink text-[13.5px] font-sans-semibold">{item.message}</Text>
        {item.action ? (
          <Pressable
            accessibilityRole="button"
            className="bg-ember rounded-[9px] py-[6px] px-[12px] shrink-0"
            onPress={() => {
              onDismiss(item.id);
              item.action.onClick?.();
            }}
          >
            <Text className="text-on-ember font-sans-bold text-[13.5px]">{item.action.label}</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
          hitSlop={8}
          onPress={() => onDismiss(item.id)}
          className="w-[32px] h-[32px] rounded-[10px] items-center justify-center"
        >
          <Icon name="close" size={16} color={onInk} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

// Viewport: absolute overlay at the bottom of the root layout. Live text is
// announced through AccessibilityInfo. Press-and-hold on a toast pauses the
// timers (the provider decides what to do with that signal).
export function ToastViewport({
  items,
  rootRef,
  politeText,
  alertText,
  onDismiss,
  onGone,
  onHoverChange,
  onFocusChange: _onFocusChange,
}) {
  const insets = useSafeAreaInsets();
  const live = items.filter((t) => !t.leaving);
  const newestFirst = live.length;

  useEffect(() => {
    if (politeText) AccessibilityInfo.announceForAccessibility(politeText);
  }, [politeText]);
  useEffect(() => {
    if (alertText) AccessibilityInfo.announceForAccessibility(alertText);
  }, [alertText]);

  if (!items.length) return null;

  return (
    <View
      ref={rootRef}
      pointerEvents="box-none"
      className="absolute left-0 right-0 items-center gap-[8px] px-[16px]"
      style={{ bottom: insets.bottom + TOAST_BOTTOM_OFFSET, zIndex: 95, elevation: 95 }}
    >
      {items.map((item) => {
        const idx = live.indexOf(item);
        const depth = item.leaving ? 0 : newestFirst - 1 - idx;
        return (
          <View key={item.id} className="w-full max-w-[480px]">
            <ToastItem
              item={item}
              depth={depth}
              onDismiss={onDismiss}
              onGone={onGone}
              onPressIn={() => onHoverChange?.(true)}
              onPressOut={() => onHoverChange?.(false)}
            />
          </View>
        );
      })}
    </View>
  );
}
