import { Pressable, Switch as RNSwitch, Text, View } from 'react-native';
import { cn } from './cn';
import { useThemeColor } from './useThemeColor';

// onChange(next) receives the new boolean, same as the client.
export default function Switch({
  checked = false,
  onChange,
  label,
  hideLabel = false,
  disabled = false,
  className,
  ...rest
}) {
  const off = useThemeColor('line-2');
  const on = useThemeColor('spruce');
  const white = useThemeColor('white');
  const toggle = () => {
    if (!disabled) onChange?.(!checked);
  };
  const { 'aria-label': ariaLabel, ...native } = rest;
  return (
    <View className={cn('flex-row items-center gap-[10px]', className)}>
      <RNSwitch
        value={Boolean(checked)}
        onValueChange={(next) => onChange?.(next)}
        disabled={disabled}
        trackColor={{ false: off, true: on }}
        thumbColor={white}
        ios_backgroundColor={off}
        accessibilityLabel={ariaLabel ?? (typeof label === 'string' ? label : undefined)}
        style={{ opacity: disabled ? 0.45 : 1 }}
        {...native}
      />
      {label && !hideLabel ? (
        <Pressable onPress={toggle} disabled={disabled} accessible={false} className="shrink">
          {typeof label === 'string' ? (
            <Text className="text-[13.5px] font-sans-semibold text-foreground">{label}</Text>
          ) : (
            label
          )}
        </Pressable>
      ) : null}
    </View>
  );
}
