import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import ActionSheet from '@/components/shared/ActionSheet';
import { useThemeColors } from './useThemeColors';

function IconButton({ icon, label, onPress, children }) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      className="w-[44px] h-[44px] items-center justify-center rounded-[12px] active:bg-well"
    >
      <Icon name={icon} size={20} color={colors.foreground} />
      {children}
    </Pressable>
  );
}

// Top bar for the signed-in shell: back (deep screens), crumb, search, theme, bell and the "New" menu.
// Same props as the client's Header. navOpen/onMenu/onActivity are accepted but unused on phones
// (the tab bar replaces the menu button; activity lives on the notifications screen).
export default function Header({ crumb, theme, unread = 0, bellOpen, onBell, openSearch, newItems = [], canGoBack = false, onBack }) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [newOpen, setNewOpen] = useState(false);
  const dark = theme?.resolved === 'dark';

  return (
    <View className="bg-background border-b border-border" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-[4px] min-h-[56px] px-[8px]">
        {canGoBack ? (
          <IconButton icon="chevL" label="Back" onPress={onBack} />
        ) : (
          <View className="w-[8px]" />
        )}
        <View className="flex-1 min-w-0 flex-row items-center gap-[6px]">
          {!canGoBack ? (
            <>
              <Text className="text-[14px] font-semibold text-muted">Collabor8r</Text>
              {crumb ? <Icon name="chevR" size={14} color={colors.muted} /> : null}
            </>
          ) : null}
          <Text numberOfLines={1} className="flex-1 text-[16px] font-bold text-foreground">
            {crumb}
          </Text>
        </View>
        <IconButton icon="search" label="Search" onPress={openSearch} />
        {theme ? (
          <IconButton icon={dark ? 'sun' : 'moon'} label={dark ? 'Switch to light theme' : 'Switch to dark theme'} onPress={theme.toggle} />
        ) : null}
        <IconButton icon="bell" label={unread ? `Notifications, ${unread} unread` : 'Notifications'} onPress={onBell}>
          {unread > 0 ? (
            <View className="absolute top-[9px] right-[9px] min-w-[9px] h-[9px] rounded-full bg-danger" accessibilityElementsHidden />
          ) : null}
        </IconButton>
        <Pressable
          onPress={() => setNewOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Create new"
          className="ml-[4px] w-[44px] h-[40px] items-center justify-center rounded-[12px] bg-accent active:opacity-80"
        >
          <Icon name="plus" size={20} color={colors['on-accent']} />
        </Pressable>
      </View>
      <ActionSheet open={newOpen} onClose={() => setNewOpen(false)} title="Create new" items={newItems} />
    </View>
  );
}
