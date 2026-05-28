import { View } from 'react-native';
import { cn } from './cn';
import { Icon } from './Icon';
import { renderLabel } from './Button';

// tone -> [background, text class, text colour token]
const SOFT = {
  ember: ['bg-ember-soft', 'text-ember-t', 'ember-t'],
  iris: ['bg-iris-soft', 'text-iris-t', 'iris-t'],
  spruce: ['bg-spruce-soft', 'text-spruce-t', 'spruce-t'],
  saffron: ['bg-saffron-soft', 'text-saffron-t', 'saffron-t'],
  plain: ['bg-well', 'text-muted', 'muted'],
  up: ['bg-spruce-soft', 'text-spruce-t', 'spruce-t'],
  down: ['bg-ember-soft', 'text-ember-t', 'ember-t'],
};
const HOT = ['bg-ember', 'text-on-ember', 'on-ember'];

const DOT = {
  ember: 'bg-ember',
  iris: 'bg-iris',
  spruce: 'bg-spruce',
  saffron: 'bg-saffron',
  plain: 'bg-faint',
  up: 'bg-spruce',
  down: 'bg-ember',
};

export default function Badge({
  variant = 'badge',
  tone = 'plain',
  icon,
  hot = false,
  label,
  className,
  textClassName,
  children,
  ...rest
}) {
  if (variant === 'dot') {
    return (
      <View
        accessible={Boolean(label)}
        accessibilityRole={label ? 'image' : undefined}
        accessibilityLabel={label}
        className={cn('w-[8px] h-[8px] rounded-full shrink-0', DOT[tone] ?? DOT.plain, className)}
        {...rest}
      />
    );
  }

  const [bg, fg, token] = hot ? HOT : SOFT[tone] ?? SOFT.plain;

  if (variant === 'count') {
    return (
      <View
        accessibilityLabel={label}
        className={cn('flex-row items-center justify-center min-w-[20px] h-[20px] px-[6px] rounded-full self-start', bg, className)}
        {...rest}
      >
        {renderLabel(children, cn('text-[11.5px] font-sans-bold', fg, textClassName))}
      </View>
    );
  }

  if (variant === 'status') {
    return (
      <View
        accessibilityLabel={label}
        className={cn('flex-row items-center gap-[6px] px-[10px] py-[4px] rounded-full self-start', bg, className)}
        {...rest}
      >
        {icon ? <Icon name={icon} size={12} cls={fg} /> : <View className="w-[7px] h-[7px] rounded-full bg-faint" />}
        {renderLabel(children, cn('text-[12px] font-sans-bold', fg, textClassName))}
      </View>
    );
  }

  return (
    <View
      accessibilityLabel={label}
      className={cn('flex-row items-center gap-[3px] px-[8px] py-[3px] rounded-full self-start', bg, className)}
      {...rest}
    >
      {icon ? <Icon name={icon} size={12} strokeWidth={2.4} cls={fg} /> : null}
      {renderLabel(children, cn('text-[11.5px] tracking-[0.12px] font-sans-bold', fg, textClassName))}
    </View>
  );
}
