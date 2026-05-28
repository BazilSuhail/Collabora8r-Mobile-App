import { Text, View } from 'react-native';
import Badge from '@/components/ui/Badge';
import RowMenu from '@/components/shared/RowMenu';
import { listStateFor } from '@/components/shared/ListState';
import { formatDate } from '@/utils/format';
import { roleLabel } from './RoleSelect';

const STATUS_TONE = { pending: 'iris', accepted: 'spruce', revoked: 'plain', expired: 'saffron' };

// Invite cards. Only pending invites can be revoked. onRevoke(invite) is handled by the page.
export default function InviteList({ invites, status, error, onRetry, canManage, onRevoke, empty }) {
  const rows = invites ?? [];
  const state = listStateFor({ status, error, onRetry, empty, count: rows.length });
  if (state) return state;

  return (
    <View accessibilityLabel="Invites" className="rounded-[15px] bg-surface border border-border overflow-hidden">
      {rows.map((i, index) => (
        <View key={i.id ?? index} className={`flex-row items-start gap-[10px] px-[14px] py-[12px] ${index ? 'border-t border-border' : ''}`}>
          <View className="flex-1 min-w-0 gap-[6px]">
            <Text className="text-[14px] font-semibold text-foreground">{i.email}</Text>
            <View className="flex-row flex-wrap items-center gap-[6px]">
              <Badge tone="plain">{roleLabel(i.role)}</Badge>
              <Badge tone={STATUS_TONE[i.status] ?? 'plain'}>{i.status}</Badge>
              <Text className="text-[12.5px] text-muted">{i.expiresAt ? `Expires ${formatDate(i.expiresAt)}` : 'No expiry'}</Text>
            </View>
          </View>
          <RowMenu
            label="Invite actions"
            items={canManage && i.status === 'pending' ? [{ id: 'revoke', label: 'Revoke invite', icon: 'close', danger: true, onSelect: () => onRevoke?.(i) }] : []}
          />
        </View>
      ))}
    </View>
  );
}
