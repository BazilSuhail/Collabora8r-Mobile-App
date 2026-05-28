import { Pressable, Text, View } from 'react-native';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';

// Loading, error and empty states for the card lists that replace the client's DataTable.
// Returns null when rows should render. empty: { icon, title, text, action }.
export function listStateFor({ status, error, onRetry, empty, count }) {
  if (status === 'loading' && !count) {
    return (
      <View className="items-center py-[32px]">
        <Spinner />
      </View>
    );
  }
  if (status === 'error') {
    return <EmptyState tone="error" icon="alert" title="Could not load this list" text={error?.message} onRetry={onRetry} />;
  }
  if (!count) {
    return <EmptyState icon={empty?.icon} title={empty?.title ?? 'Nothing here yet'} text={empty?.text} action={empty?.action} />;
  }
  return null;
}

// "Load more" footer (client DataTable hasMore/onLoadMore/loadingMore).
export function LoadMore({ hasMore, onLoadMore, loadingMore }) {
  if (!hasMore) return null;
  return (
    <Pressable
      onPress={onLoadMore}
      disabled={loadingMore}
      accessibilityRole="button"
      className="self-center flex-row items-center gap-[8px] min-h-[44px] px-[16px] rounded-[12px] border border-border active:bg-well"
    >
      {loadingMore ? <Spinner size="sm" /> : null}
      <Text className="text-[14px] font-semibold text-foreground">{loadingMore ? 'Loading' : 'Load more'}</Text>
    </Pressable>
  );
}
