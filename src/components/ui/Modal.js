import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  Pressable,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from './cn';
import { useThemeColor } from './useThemeColor';

// Module stack of open modals, bottom to top. Shared by every modal instance.
const stack = [];
const MAX_DEPTH = 2;
export const SCRIM = 'bg-backdrop';
let hooks = { onFirstOpen: null };

export function registerModalHooks(next) {
  hooks = { ...hooks, ...next };
}

// Closes every open modal, top first. Used by the layout on route change.
// Bypasses the dirty guard and dismissible (a route change always leaves).
export function closeAllModals(reason = 'route') {
  [...stack].reverse().forEach((entry) => entry.close(reason, true));
}

// Native "Discard changes?" prompt, used by the dirty guard.
export function confirmDiscard(onDiscard) {
  Alert.alert('Discard changes?', 'Your edits will be lost.', [
    { text: 'Keep editing', style: 'cancel' },
    { text: 'Discard', style: 'destructive', onPress: onDiscard },
  ]);
}

// Modal engine. motion "center" = centred card, "side" / "sheet" = bottom sheet
// (the web already shows side panels as bottom sheets on phones).
// Android back maps to the "escape" close reason.
export default function Modal({
  open,
  onClose,
  label,
  labelledBy: _labelledBy,
  describedBy: _describedBy,
  initialFocus: _initialFocus,
  returnFocus: _returnFocus,
  dismissible = true,
  onBeforeClose,
  motion = 'center',
  side: _side,
  wrapClass,
  panelClass,
  scrimClass = SCRIM,
  fullHeight = false,
  children,
}) {
  const [visible, setVisible] = useState(Boolean(open));
  const anim = useRef(new Animated.Value(0)).current;
  const entryRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const onBeforeRef = useRef(onBeforeClose);
  const dismissibleRef = useRef(dismissible);
  onCloseRef.current = onClose;
  onBeforeRef.current = onBeforeClose;
  dismissibleRef.current = dismissible;
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const shadowColor = useThemeColor('shadow');
  const sheet = motion !== 'center';

  const close = (reason = 'close', force = false) => {
    if (!force && (reason === 'escape' || reason === 'scrim') && !dismissibleRef.current) return;
    if (!force && onBeforeRef.current && onBeforeRef.current() === false) {
      confirmDiscard(() => onCloseRef.current?.('close'));
      return;
    }
    onCloseRef.current?.(reason);
  };
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (open) {
      if (stack.length >= MAX_DEPTH) {
        if (__DEV__) console.warn('Modal: max depth reached, refusing to open another modal');
        return undefined;
      }
      const entry = { close: (r, f) => closeRef.current(r, f) };
      entryRef.current = entry;
      if (stack.length === 0) hooks.onFirstOpen?.();
      stack.push(entry);
      setVisible(true);
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: sheet ? 280 : 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return () => {
        const i = stack.indexOf(entry);
        if (i >= 0) stack.splice(i, 1);
      };
    }
    if (!visible) return undefined;
    Animated.timing(anim, {
      toValue: 0,
      duration: sheet ? 220 : 150,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setVisible(false));
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!visible) return null;

  const content = typeof children === 'function' ? children({ close: () => closeRef.current('close') }) : children;

  const panelStyle = sheet
    ? {
        maxHeight: height * (fullHeight ? 0.94 : 0.9),
        height: fullHeight ? height * 0.94 : undefined,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [height * 0.6, 0] }) }],
      }
    : {
        maxHeight: height * 0.86,
        width: Math.min(560, width - 24),
        opacity: anim,
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
      };

  return (
    <RNModal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => closeRef.current('escape')}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <Animated.View className={cn('absolute inset-0', scrimClass)} style={{ opacity: anim }}>
          <Pressable
            className="flex-1"
            accessibilityLabel="Close"
            accessibilityRole="button"
            onPress={() => closeRef.current('scrim')}
          />
        </Animated.View>
        <View
          pointerEvents="box-none"
          className={cn('flex-1', sheet ? 'justify-end' : 'items-center justify-center p-[12px]', wrapClass)}
        >
          <Animated.View
            accessibilityViewIsModal
            accessibilityLabel={label}
            className={cn(
              'bg-float border border-line overflow-hidden',
              sheet ? 'w-full rounded-t-[24px] border-b-0' : 'rounded-card',
              panelClass,
            )}
            style={[
              panelStyle,
              sheet ? { paddingBottom: 0 } : null,
              {
                shadowColor,
                shadowOpacity: 0.2,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 12 },
                elevation: 12,
              },
            ]}
          >
            {sheet ? <View className="self-center w-[40px] h-[4px] rounded-full bg-line-2 mt-[8px]" /> : null}
            {content}
            {sheet ? <View style={{ height: insets.bottom }} /> : null}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}
