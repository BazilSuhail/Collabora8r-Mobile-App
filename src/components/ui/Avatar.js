import { Image, Text, View } from 'react-native';
import { cn } from './cn';
import Tooltip from './Tooltip';

const SIZES = {
  xs: { box: 'w-[22px] h-[22px]', text: 'text-[9px]', px: 22 },
  sm: { box: 'w-[28px] h-[28px]', text: 'text-[11px]', px: 28 },
  md: { box: 'w-[36px] h-[36px]', text: 'text-[12.5px]', px: 36 },
  lg: { box: 'w-[48px] h-[48px]', text: 'text-[15px]', px: 48 },
  xl: { box: 'w-[96px] h-[96px]', text: 'text-[30px]', px: 96 },
};
const TONES = ['bg-av-t0', 'bg-av-t1', 'bg-av-t2', 'bg-av-t3'];

export function hashTone(seed) {
  let h = 0;
  for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 4;
}

export function initials(name) {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export default function Avatar({
  name,
  src,
  size = 'sm',
  tone,
  id,
  ring = 'none',
  decorative = true,
  tooltip = false,
  className,
  ...rest
}) {
  const t = tone ?? hashTone(id ?? name);
  const s = SIZES[size] ?? SIZES.sm;
  const avatar = (
    <View
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : 'image'}
      accessibilityLabel={decorative ? undefined : name}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'yes'}
      className={cn(
        'rounded-full items-center justify-center overflow-hidden shrink-0',
        s.box,
        src ? 'bg-well' : TONES[t] ?? TONES[0],
        ring === 'surface' && 'border-2 border-surface',
        className,
      )}
      {...rest}
    >
      {src ? (
        <Image source={{ uri: src }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      ) : (
        <Text className={cn('font-sans-bold text-av-ink', s.text)} numberOfLines={1}>
          {initials(name)}
        </Text>
      )}
    </View>
  );

  if (!tooltip) return avatar;

  return (
    <Tooltip content={name} mode="label">
      {avatar}
    </Tooltip>
  );
}
