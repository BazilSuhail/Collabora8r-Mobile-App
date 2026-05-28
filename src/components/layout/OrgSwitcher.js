import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import ActionSheet from '@/components/shared/ActionSheet';
import { useOrg } from '@/context/OrgContext';
import { paths } from '@/routes/paths';
import { useThemeColors } from './useThemeColors';

export const SWITCH_CLASS =
  'flex-row items-center gap-[10px] w-full min-h-[44px] px-[10px] rounded-[12px] border border-side-line active:bg-side-pill';

// Organization switcher. personal=true when the open project has no org. Opens a picker sheet.
export default function OrgSwitcher({ personal = false, onNavigate }) {
  const { orgs = [], org, setOrgId } = useOrg();
  const router = useRouter();
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);
  const label = personal ? 'Personal' : (org?.name ?? 'Choose organization');
  const items = [
    ...orgs.map((o) => ({
      id: o.id,
      label: o.name,
      icon: 'building',
      selected: !personal && o.id === org?.id,
      onSelect: () => setOrgId(o.id),
    })),
    ...(orgs.length ? ['separator'] : []),
    {
      id: 'manage',
      label: 'Manage organizations',
      icon: 'gear',
      onSelect: () => {
        onNavigate?.();
        router.navigate(paths.orgs());
      },
    },
  ];
  const muted = colors['side-muted'] ?? colors.muted;
  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={`Organization: ${label}`} onPress={() => setOpen(true)} className={SWITCH_CLASS}>
        <Icon name="building" size={16} color={colors['side-text'] ?? colors.foreground} />
        <Text numberOfLines={1} className="flex-1 min-w-0 text-[13px] font-semibold text-side-text">
          {label}
        </Text>
        <Icon name="upDown" size={14} color={muted} />
      </Pressable>
      <ActionSheet open={open} onClose={() => setOpen(false)} title="Organization" items={items} />
    </>
  );
}
