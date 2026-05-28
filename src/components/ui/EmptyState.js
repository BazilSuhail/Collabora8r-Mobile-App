import { Text, View } from 'react-native';
import { cn } from './cn';
import Button from './Button';
import { Icon } from './Icon';

export default function EmptyState({
  icon = 'inbox',
  title,
  text,
  action,
  tone = 'empty',
  onRetry,
  className,
  ...rest
}) {
  const isError = tone === 'error';
  return (
    <View
      accessibilityLiveRegion={isError ? 'assertive' : undefined}
      accessibilityRole={isError ? 'alert' : undefined}
      className={cn('items-center gap-[6px] px-[16px] py-[36px]', className)}
      {...rest}
    >
      <View style={{ opacity: 0.7 }}>
        <Icon name={icon} size={28} cls={isError ? 'text-bad' : 'text-muted'} />
      </View>
      {typeof title === 'string' || typeof title === 'number' ? (
        <Text className={cn('text-center font-sans-bold text-[14px]', isError ? 'text-bad' : 'text-foreground')}>
          {title}
        </Text>
      ) : (
        title ?? null
      )}
      {text ? (
        typeof text === 'string' ? (
          <Text className="text-center text-[13px] text-muted font-sans">{text}</Text>
        ) : (
          text
        )
      ) : null}
      {action || (isError && onRetry) ? (
        <View className="mt-[8px] flex-row flex-wrap justify-center gap-[8px]">
          {action}
          {isError && onRetry ? (
            <Button variant="ghost" size="sm" icon="refresh" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
