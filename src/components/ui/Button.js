import { Children, isValidElement, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { router } from 'expo-router';
import { cn } from './cn';
import { Icon } from './Icon';
import Spinner from './Spinner';
import { useThemeColor } from './useThemeColor';

// Variant -> container classes, text classes, and the colour token for icons/spinner.
const VARIANTS = {
  ink: { box: 'bg-ink border-transparent', text: 'text-on-ink', tone: 'on-ink' },
  ember: { box: 'bg-ember border-transparent', text: 'text-on-ember', tone: 'on-ember' },
  ghost: { box: 'bg-surface border-line-2', text: 'text-foreground', tone: 'foreground' },
  soft: { box: 'bg-well border-transparent', text: 'text-foreground', tone: 'foreground' },
  danger: { box: 'bg-danger-solid border-transparent', text: 'text-white', tone: 'white' },
};
const ICON_GHOST = { box: 'bg-transparent border-transparent', text: 'text-foreground', tone: 'foreground' };
const ICON_PLAIN = { box: 'bg-surface border-line', text: 'text-foreground', tone: 'foreground' };
const BUSY = { box: 'bg-ember-soft border-transparent', text: 'text-ember-t', tone: 'ember-t' };
const PRESSED = { box: 'bg-ink border-transparent', text: 'text-on-ink', tone: 'on-ink' };

// Wraps bare strings and numbers in Text so callers can pass plain labels.
export function renderLabel(children, textClass, lines = 1) {
  return Children.map(children, (child) => {
    if (child == null || child === false || child === true) return null;
    if (typeof child === 'string' || typeof child === 'number') {
      return (
        <Text className={textClass} numberOfLines={lines}>
          {child}
        </Text>
      );
    }
    return isValidElement(child) ? child : null;
  });
}

function pickLook({ loading, pressed, iconOnly, variant }) {
  if (loading) return BUSY;
  if (pressed) return PRESSED;
  if (iconOnly) return variant === 'ghost' ? ICON_GHOST : VARIANTS[variant] ?? ICON_PLAIN;
  return VARIANTS[variant] ?? VARIANTS.ghost;
}

// href / to: navigates with expo-router after onClick (replaces `as={Link}`).
export default function Button({
  variant = 'ghost',
  size = 'md',
  icon,
  iconOnly = false,
  pressed,
  loading = false,
  magnetic: _magnetic,
  type: _type,
  as: _as,
  form: _form,
  href,
  to,
  ref,
  onClick,
  onPress,
  disabled,
  className,
  textClassName,
  style,
  children,
  ...rest
}) {
  const [down, setDown] = useState(false);
  const {
    'aria-label': ariaLabel,
    'aria-busy': _ab,
    'aria-pressed': _ap,
    'aria-haspopup': _ah,
    'aria-expanded': _ae,
    'aria-controls': _ac,
    'data-autofocus': _da,
    onKeyDown: _ok,
    id: _id,
    ...native
  } = rest;
  const label = ariaLabel ?? native.accessibilityLabel;
  if (__DEV__ && iconOnly && !label) {
    throw new Error('Button: iconOnly requires an aria-label');
  }

  const isBusy = Boolean(loading);
  const isDisabled = Boolean(disabled) || isBusy;
  const look = pickLook({ loading: isBusy, pressed: pressed && iconOnly, iconOnly, variant });
  const tone = useThemeColor(look.tone);

  const sm = size === 'sm';
  const box = iconOnly
    ? cn('items-center justify-center border', sm ? 'w-[32px] h-[32px] rounded-[10px]' : 'w-[40px] h-[40px] rounded-[12px]')
    : cn(
        'flex-row items-center justify-center border gap-[8px]',
        sm ? 'min-h-[36px] px-[13px] rounded-[10px]' : 'min-h-[42px] px-[16px] rounded-ctl',
      );
  const textClass = cn('font-sans-bold', sm ? 'text-[12.5px]' : 'text-[13.5px]', look.text, textClassName);

  const handlePress = (e) => {
    if (isDisabled) return;
    onClick?.(e);
    if (onPress && onPress !== onClick) onPress(e);
    const dest = href ?? to;
    if (dest) router.push(dest);
  };

  return (
    <Pressable
      {...native}
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: isBusy, disabled: isDisabled, selected: pressed }}
      disabled={isDisabled}
      hitSlop={sm || iconOnly ? 6 : undefined}
      onPressIn={() => setDown(true)}
      onPressOut={() => setDown(false)}
      onPress={handlePress}
      className={cn(box, look.box, className)}
      style={[
        { opacity: isDisabled && !isBusy ? 0.45 : 1, transform: [{ scale: down ? 0.96 : 1 }] },
        style,
      ]}
    >
      {isBusy ? <Spinner size="sm" tone="current" color={tone} /> : null}
      {icon ? <Icon name={icon} size={sm || iconOnly ? 16 : 17} color={tone} /> : null}
      {renderLabel(children, textClass)}
    </Pressable>
  );
}
