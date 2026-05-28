import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import ActionSheet from '@/components/shared/ActionSheet';
import RowMenu from '@/components/shared/RowMenu';
import { LoadMore, listStateFor } from '@/components/shared/ListState';
import { useThemeColors } from '@/components/layout/useThemeColors';
import { ORG_ROLES, PROJECT_ROLES } from '@/metadata/settings';
import { formatDate } from '@/utils/format';
import { roleLabel } from './RoleSelect';

const ALL = { org: ORG_ROLES, project: PROJECT_ROLES };

// Member cards. Admins change roles (tap the role chip) and remove others. Every member can leave from their own row.
// Mutations live in the page: onRoleChange(member, role), onRemove(member), onLeave(member).
export default function MemberList({
  members,
  status,
  error,
  onRetry,
  scope = 'org',
  roles,
  canManage,
  selfId,
  onRoleChange,
  onRemove,
  onLeave,
  empty,
  hasMore,
  onLoadMore,
  loadingMore,
}) {
  const colors = useThemeColors();
  const [roleFor, setRoleFor] = useState(null);
  const rows = members ?? [];
  const state = listStateFor({ status, error, onRetry, empty, count: rows.length });
  if (state) return state;

  const list = ALL[scope] ?? ORG_ROLES;
  const roleOptions = roles ? list.filter((r) => roles.includes(r.id)) : list;

  const menuFor = (m) => {
    if (m.userId === selfId) return [{ id: 'leave', label: 'Leave', icon: 'logout', danger: true, onSelect: () => onLeave?.(m) }];
    if (canManage) return [{ id: 'remove', label: 'Remove', icon: 'userMinus', danger: true, onSelect: () => onRemove?.(m) }];
    return [];
  };

  return (
    <View className="gap-[12px]">
      <View accessibilityLabel="Members" className="rounded-[15px] bg-surface border border-border overflow-hidden">
        {rows.map((m, index) => {
          const editable = canManage && m.userId !== selfId;
          return (
            <View key={m.userId ?? index} className={`flex-row items-center gap-[12px] px-[14px] py-[12px] ${index ? 'border-t border-border' : ''}`}>
              <Avatar name={m.userName} src={m.userAvatar} size="sm" />
              <View className="flex-1 min-w-0 gap-[4px]">
                <Text numberOfLines={1} className="text-[14px] font-semibold text-foreground">
                  {m.userName || 'Unnamed'}
                </Text>
                {m.userHeadline ? (
                  <Text numberOfLines={1} className="text-[12.5px] text-muted">
                    {m.userHeadline}
                  </Text>
                ) : null}
                <View className="flex-row flex-wrap items-center gap-[6px]">
                  {editable ? (
                    <Pressable
                      onPress={() => setRoleFor(m)}
                      accessibilityRole="button"
                      accessibilityLabel={`Role for ${m.userName || 'member'}: ${roleLabel(m.role)}`}
                      className="flex-row items-center gap-[4px] min-h-[30px] px-[10px] rounded-full border border-border-strong active:bg-well"
                    >
                      <Text className="text-[12.5px] font-semibold text-foreground">{roleLabel(m.role)}</Text>
                      <Icon name="upDown" size={12} color={colors.muted} />
                    </Pressable>
                  ) : (
                    <Badge tone="plain">{roleLabel(m.role)}</Badge>
                  )}
                  <Text className="text-[12px] text-muted">{m.joinedAt ? `Joined ${formatDate(m.joinedAt)}` : ''}</Text>
                </View>
              </View>
              <RowMenu label="Member actions" items={menuFor(m)} />
            </View>
          );
        })}
      </View>
      <LoadMore hasMore={hasMore} onLoadMore={onLoadMore} loadingMore={loadingMore} />
      <ActionSheet
        open={Boolean(roleFor)}
        onClose={() => setRoleFor(null)}
        title={roleFor ? `Role for ${roleFor.userName || 'member'}` : 'Role'}
        items={roleOptions.map((r) => ({
          id: r.id,
          label: r.label,
          description: r.desc,
          selected: roleFor?.role === r.id,
          onSelect: () => roleFor && r.id !== roleFor.role && onRoleChange?.(roleFor, r.id),
        }))}
      />
    </View>
  );
}
