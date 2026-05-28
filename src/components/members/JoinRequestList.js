import { Pressable, Text, View } from 'react-native';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { listStateFor } from '@/components/shared/ListState';
import { relativeTime } from '@/utils/format';

const STATUS_TONE = { pending: 'iris', approved: 'spruce', declined: 'plain' };

// Join request cards. Pending requests show Approve and Decline buttons (easier to hit than a menu).
// onDecide(request, decision) opens the page's decision form with that preset.
export default function JoinRequestList({ requests, status, error, onRetry, canDecide, onDecide, empty }) {
  const rows = requests ?? [];
  const state = listStateFor({ status, error, onRetry, empty, count: rows.length });
  if (state) return state;

  return (
    <View accessibilityLabel="Join requests" className="rounded-[15px] bg-surface border border-border overflow-hidden">
      {rows.map((r, index) => (
        <View key={r.id ?? index} className={`gap-[10px] px-[14px] py-[12px] ${index ? 'border-t border-border' : ''}`}>
          <View className="flex-row items-center gap-[12px]">
            <Avatar name={r.userName} src={r.userAvatar} size="sm" />
            <View className="flex-1 min-w-0">
              <Text numberOfLines={1} className="text-[14px] font-semibold text-foreground">
                {r.userName || 'Unnamed'}
              </Text>
              {r.message ? (
                <Text numberOfLines={2} className="text-[12.5px] text-muted">
                  {r.message}
                </Text>
              ) : null}
            </View>
            <Badge tone={STATUS_TONE[r.status] ?? 'plain'}>{r.status}</Badge>
          </View>
          <View className="flex-row items-center gap-[8px]">
            <Text className="flex-1 text-[12.5px] text-muted">{r.createdAt ? `Requested ${relativeTime(r.createdAt)}` : '-'}</Text>
            {canDecide && r.status === 'pending' ? (
              <>
                <Pressable
                  onPress={() => onDecide?.(r, 'decline')}
                  accessibilityRole="button"
                  className="min-h-[40px] px-[14px] rounded-[12px] border border-border items-center justify-center active:bg-well"
                >
                  <Text className="text-[13.5px] font-semibold text-danger">Decline</Text>
                </Pressable>
                <Pressable
                  onPress={() => onDecide?.(r, 'approve')}
                  accessibilityRole="button"
                  className="min-h-[40px] px-[14px] rounded-[12px] bg-accent items-center justify-center active:opacity-80"
                >
                  <Text className="text-[13.5px] font-bold text-on-accent">Approve</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}
