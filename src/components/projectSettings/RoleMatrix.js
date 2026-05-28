// feat(screens/projectSettings/components/RoleMatrix): show which permissions each project role grants, with a per-role action menu.
import { ScrollView, Text, View } from 'react-native';
import Button from '@/components/ui/Button';
import Dropdown from '@/components/ui/Dropdown';
import { Icon } from '@/components/ui/Icon';

const PERM_W = 'w-[180px]';
const ROLE_W = 'w-[120px]';

export default function RoleMatrix({ roles, canManage, onEdit, onDelete }) {
  const permissions = [...new Set(roles.flatMap((r) => r.permissions ?? []))].sort();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator accessibilityLabel="Permission matrix">
      <View>
        <View className="flex-row border-b border-border py-2">
          <Text className={`${PERM_W} px-2 text-xs font-bold uppercase text-muted`}>Permission</Text>
          {roles.map((role) => (
            <View key={role._id} className={`${ROLE_W} flex-row items-center gap-1 px-2`}>
              {role.isSystem ? <Icon name="lock" size={14} className="text-muted" label="System role" /> : null}
              <Text className="flex-1 font-semibold text-foreground" numberOfLines={1}>
                {role.name}
              </Text>
              {canManage ? (
                <Dropdown
                  label={`Actions for ${role.name}`}
                  items={[
                    { id: 'edit', label: 'Edit permissions', icon: 'pen', onSelect: () => onEdit?.(role) },
                    ...(role.isSystem
                      ? []
                      : [{ id: 'delete', label: 'Delete role', icon: 'trash', danger: true, onSelect: () => onDelete?.(role) }]),
                  ]}
                  trigger={(triggerProps) => (
                    <Button
                      iconOnly
                      variant="ghost"
                      size="sm"
                      icon="more"
                      accessibilityLabel={`Actions for ${role.name}`}
                      {...triggerProps}
                    />
                  )}
                />
              ) : null}
            </View>
          ))}
        </View>
        {permissions.map((permission) => (
          <View key={permission} className="flex-row items-center border-b border-border py-2">
            <Text className={`${PERM_W} px-2 font-semibold text-foreground`} numberOfLines={2}>
              {permission}
            </Text>
            {roles.map((role) => {
              const granted = (role.permissions ?? []).includes(permission);
              return (
                <View key={role._id} className={`${ROLE_W} px-2`}>
                  {granted ? (
                    <Icon name="check" size={16} className="text-success" label={`${role.name} has ${permission}`} />
                  ) : (
                    <Text accessibilityLabel={`${role.name} does not have ${permission}`} className="text-muted">
                      -
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
