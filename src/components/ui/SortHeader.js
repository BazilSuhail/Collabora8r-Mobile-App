import { Pressable, Text } from 'react-native';
import { cn } from './cn';
import { Icon } from './Icon';

// Sort toggle for a list column header (mobile has no <th>).
export default function SortHeader({ label, sortKey, sort, onSort, className, style, ...rest }) {
  const active = sort?.key === sortKey;
  const dir = active ? sort.dir : null;
  const spoken = dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'not sorted';
  const icon = dir === 'asc' ? 'up' : dir === 'desc' ? 'downArr' : 'upDown';
  const fg = active ? 'text-foreground' : 'text-muted';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={typeof label === 'string' ? `${label}, ${spoken}` : undefined}
      onPress={() => onSort?.(sortKey)}
      hitSlop={6}
      className={cn('flex-row items-center gap-[4px]', className)}
      style={style}
      {...rest}
    >
      {typeof label === 'string' ? (
        <Text className={cn('text-[12px] font-sans-bold uppercase', fg)}>{label}</Text>
      ) : (
        label
      )}
      <Icon name={icon} size={12} cls={fg} />
    </Pressable>
  );
}
