import { Children, cloneElement, isValidElement, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { cn } from './cn';
import { useThemeColor } from './useThemeColor';

const HOLD_MS = 1600;

// Touch replacement for the hover tooltip: long-press the child to show the
// text in a small bubble for a moment. mode "describe" also exposes the text
// as the child's accessibilityHint; mode "label" leaves accessibility alone
// (the child already carries its own label).
export default function Tooltip({ content, placement = 'top', delay = 400, mode = 'describe', children }) {
  const [open, setOpen] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);
  const shadow = useThemeColor('shadow');

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    Animated.timing(opacity, { toValue: open ? 1 : 0, duration: open ? 160 : 100, useNativeDriver: true }).start();
  }, [open, opacity]);

  const show = () => {
    clearTimeout(timer.current);
    setOpen(true);
    timer.current = setTimeout(() => setOpen(false), HOLD_MS);
  };

  const child = Children.only(children);
  const hint = mode === 'describe' && typeof content === 'string' ? content : undefined;

  // Pressable-like children (Button, FilterChip, ...) take onLongPress directly;
  // anything else gets wrapped in a Pressable.
  const anchor =
    isValidElement(child) && (child.props.onClick || child.props.onPress)
      ? cloneElement(child, {
          onLongPress: show,
          delayLongPress: delay,
          accessibilityHint: child.props.accessibilityHint ?? hint,
        })
      : (
          <Pressable onLongPress={show} delayLongPress={delay} accessibilityHint={hint}>
            {child}
          </Pressable>
        );

  if (content == null || content === '') return child;

  const pos =
    placement === 'bottom'
      ? 'top-full mt-[8px]'
      : placement === 'left'
        ? 'right-full mr-[8px] top-0'
        : placement === 'right'
          ? 'left-full ml-[8px] top-0'
          : 'bottom-full mb-[8px]';

  return (
    <View className="relative self-start">
      {anchor}
      {open ? (
        <Animated.View
          pointerEvents="none"
          importantForAccessibility="no-hide-descendants"
          className={cn(
            'absolute z-[90] rounded-[10px] px-[10px] py-[6px] bg-float border border-line',
            (placement === 'top' || placement === 'bottom') && 'self-center',
            pos,
          )}
          style={{
            opacity,
            minWidth: 60,
            maxWidth: 240,
            shadowColor: shadow,
            shadowOpacity: 0.18,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          }}
        >
          {typeof content === 'string' || typeof content === 'number' ? (
            <Text className="text-[12.5px] text-foreground font-sans">{content}</Text>
          ) : (
            content
          )}
        </Animated.View>
      ) : null}
    </View>
  );
}
