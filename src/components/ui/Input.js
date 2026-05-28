import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { cn } from './cn';
import { Icon } from './Icon';
import { useThemeColor } from './useThemeColor';

const KEYBOARD = {
  email: 'email-address',
  number: 'numeric',
  tel: 'phone-pad',
  url: 'url',
  search: 'default',
};

// Maps web input props onto TextInput props. onChange still receives an
// event-like object ({ target: { value } }) so ported handlers keep working.
export function toNativeInputProps({
  type,
  onChange,
  onChangeText,
  disabled,
  readOnly,
  rows,
  autoComplete,
  min: _min,
  max: _max,
  step: _step,
  required: _required,
  name: _name,
  form: _form,
  onKeyDown,
  onSubmitEditing,
  ...rest
}) {
  const out = { ...rest };
  if (type === 'password') out.secureTextEntry = true;
  if (KEYBOARD[type]) out.keyboardType = KEYBOARD[type];
  if (type === 'email' || type === 'password' || type === 'url') out.autoCapitalize = out.autoCapitalize ?? 'none';
  if (autoComplete) out.autoComplete = autoComplete === 'current-password' || autoComplete === 'new-password' ? 'password' : autoComplete;
  if (disabled || readOnly) out.editable = false;
  if (rows) out.numberOfLines = rows;
  if (out.value != null && typeof out.value !== 'string') out.value = String(out.value);
  out.onChangeText = (text) => {
    onChangeText?.(text);
    onChange?.({ target: { value: text, name: _name }, currentTarget: { value: text }, nativeEvent: { text } });
  };
  out.onSubmitEditing = (e) => {
    onSubmitEditing?.(e);
    onKeyDown?.({ key: 'Enter', preventDefault() {}, stopPropagation() {}, target: { value: e?.nativeEvent?.text } });
  };
  return out;
}

export default function Input({
  label,
  hideLabel = false,
  hint,
  error,
  as = 'input',
  variant = 'field',
  size = 'md',
  wide: _wide = false,
  id: _id,
  ref,
  className,
  inputClassName,
  ...rest
}) {
  const [focused, setFocused] = useState(false);
  const placeholderColor = useThemeColor('faint');
  const muted = useThemeColor('muted');
  const isTextarea = as === 'textarea' || rest.multiline;
  const { onFocus, onBlur, 'aria-label': ariaLabel, 'aria-describedby': _ad, 'aria-invalid': _ai, ...inputRest } = rest;
  const native = toNativeInputProps(inputRest);

  const focusProps = {
    onFocus: (e) => {
      setFocused(true);
      onFocus?.(e);
    },
    onBlur: (e) => {
      setFocused(false);
      onBlur?.(e);
    },
  };

  const border = error ? 'border-bad' : focused ? 'border-ember' : 'border-line-2';
  const controlClass = isTextarea
    ? cn('w-full min-h-[96px] py-[10px] px-[14px] rounded-[12px] border bg-surface text-foreground text-[14px] font-sans', border)
    : cn(
        'w-full px-[14px] rounded-ctl border bg-surface text-foreground font-sans',
        size === 'sm' ? 'h-[36px] text-[13px]' : 'h-[44px] text-[14px]',
        border,
      );

  const a11y = {
    accessibilityLabel: ariaLabel ?? label,
    accessibilityHint: typeof hint === 'string' ? hint : undefined,
  };

  const control = (extra) => (
    <TextInput
      ref={ref}
      placeholderTextColor={placeholderColor}
      multiline={isTextarea}
      textAlignVertical={isTextarea ? 'top' : 'center'}
      {...a11y}
      {...native}
      {...focusProps}
      className={cn(controlClass, inputClassName, extra)}
    />
  );

  if (variant === 'bare') return control(className);

  const labelEl = label && !hideLabel ? (
    <Text className="text-muted text-[12.5px] font-sans-bold">{label}</Text>
  ) : null;

  const body =
    variant === 'search' ? (
      <View
        className={cn(
          'flex-row items-center gap-[8px] px-[14px] rounded-ctl border bg-surface',
          size === 'sm' ? 'h-[36px]' : 'h-[44px]',
          border,
        )}
      >
        <Icon name="search" size={17} color={muted} />
        <TextInput
          ref={ref}
          placeholderTextColor={placeholderColor}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCorrect={false}
          {...a11y}
          {...native}
          {...focusProps}
          className={cn('flex-1 h-full min-w-0 text-foreground font-sans', size === 'sm' ? 'text-[13px]' : 'text-[14px]', inputClassName)}
        />
      </View>
    ) : (
      control()
    );

  return (
    <View className={cn('gap-[6px] min-w-0', className)}>
      {labelEl}
      {body}
      {hint ? (
        typeof hint === 'string' ? <Text className="text-muted text-[12px] font-sans">{hint}</Text> : hint
      ) : null}
      {error ? (
        <Text accessibilityLiveRegion="polite" className="text-bad text-[13px] font-sans-semibold">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
