import { Pressable, Text } from 'react-native';
import { cn } from './cn';
import { Icon } from './Icon';
import { renderLabel } from './Button';

export default function FilterChip({
  pressed = false,
  onClick,
  onPress,
  icon,
  count,
  className,
  children,
  ...rest
}) {
  const fg = pressed ? 'text-on-ink' : 'text-muted';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(pressed) }}
      onPress={(e) => {
        onClick?.(e);
        if (onPress && onPress !== onClick) onPress(e);
      }}
      hitSlop={6}
      className={cn(
        'flex-row items-center gap-[6px] h-[32px] px-[12px] rounded-full border self-start',
        pressed ? 'bg-ink border-transparent' : 'bg-surface border-line',
        className,
      )}
      {...rest}
    >
      {icon ? <Icon name={icon} size={15} cls={fg} /> : null}
      {renderLabel(children, cn('text-[12.5px] font-sans-bold', fg))}
      {count != null ? (
        <Text className={cn('text-[12.5px] font-sans-bold', pressed ? 'text-on-ink' : 'text-foreground')}>
          {count}
        </Text>
      ) : null}
    </Pressable>
  );
}
