// feat(screens/integrations/components/DeliveriesDrawer): list a webhook's recent deliveries and redeliver one.
import { ActivityIndicator, FlatList, Platform, Text, View } from 'react-native';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/context/ToastContext';
import { listDeliveries, redeliver } from '@/libs/api/automation';
import { relativeTime } from '@/utils/format';
import { usePaged } from '@/utils/usePaged';
import { MoreButton, Sheet } from '@/components/issues/sheets';

const withId = (row) => ({ ...row, id: String(row.id ?? row._id) });

const TONE = { success: 'spruce', failed: 'ember' };
const label = (status) => (status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending');
const MONO = Platform.select({ ios: 'Menlo', default: 'monospace' });

// Mount with key={webhook.id} so the list refetches for each webhook.
export default function DeliveriesDrawer({ open, onClose, pid, webhook }) {
  const toast = useToast();
  const deliveriesQ = usePaged((q) => listDeliveries(pid, webhook.id, q), {});
  const rows = deliveriesQ.items.map(withId);

  const onRedeliver = async (row) => {
    try {
      await redeliver(pid, webhook.id, row.id);
      toast.success('Redelivered');
      deliveriesQ.reload();
    } catch {
      // The API layer shows the error toast.
    }
  };

  let empty = null;
  if (deliveriesQ.status === 'loading') empty = <ActivityIndicator className="my-[20px]" />;
  else if (deliveriesQ.status === 'error')
    empty = <EmptyState tone="error" title="Could not load deliveries" onRetry={deliveriesQ.reload} />;
  else empty = <EmptyState icon="send" title="No deliveries yet" text="Deliveries appear after an event or a test ping." />;

  return (
    <Sheet open={open} onClose={onClose} title="Deliveries" subtitle={webhook.url} scroll={false}>
      <FlatList
        data={deliveriesQ.status === 'success' ? rows : []}
        keyExtractor={(r) => r.id}
        style={{ maxHeight: 520 }}
        ListEmptyComponent={empty}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (deliveriesQ.hasMore && !deliveriesQ.loadingMore) deliveriesQ.loadMore();
        }}
        ListFooterComponent={deliveriesQ.loadingMore ? <ActivityIndicator className="my-[12px]" /> : null}
        renderItem={({ item: row }) => (
          <View className="flex-row items-center gap-[10px] py-[12px] border-b border-border">
            <View className="flex-1 min-w-0 gap-[6px]">
              <Text numberOfLines={1} className="text-[12.5px] text-foreground" style={{ fontFamily: MONO }}>
                {row.event ?? 'ping'}
              </Text>
              <View className="flex-row flex-wrap items-center gap-[8px]">
                <Badge tone={TONE[row.status] ?? 'plain'} variant="status" label={`Result: ${label(row.status)}`}>
                  {label(row.status)}
                </Badge>
                <Text className="text-muted text-[12.5px]">Code {row.responseCode ?? '—'}</Text>
                <Text className="text-muted text-[12.5px]">
                  {row.attempts ?? 0} {row.attempts === 1 ? 'attempt' : 'attempts'}
                </Text>
                <Text className="text-muted text-[12.5px]">{row.createdAt ? relativeTime(row.createdAt) : '—'}</Text>
              </View>
            </View>
            <MoreButton
              label="Delivery actions"
              items={[{ id: 'redeliver', label: 'Redeliver', icon: 'restore', onSelect: () => onRedeliver(row) }]}
            />
          </View>
        )}
      />
    </Sheet>
  );
}
