import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BOTTOM_NAV } from '@/metadata/nav';
import { paths } from '@/routes/paths';
import { Icon } from '@/components/ui/Icon';
import { useThemeColors } from './useThemeColors';

// Phone tab bar, mirrors BOTTOM_NAV: Dashboard, Issues (project), Board, My work, More.
// Rendered as the custom tabBar of the expo-router Tabs navigator in Layout.
export default function BottomNav({ pathname = '', pid, badges = {}, drawerOpen = false, onMore }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  // Project tabs with no project fall back to the projects list.
  const tabs = BOTTOM_NAV.map((t) => ({
    ...t,
    href: t.to ? (t.project ? (pid ? t.to(pid) : paths.projects()) : t.to()) : null,
  }));

  // Longest prefix wins. Nothing matched falls back to More.
  let activeId = 'more';
  let best = -1;
  tabs.forEach((t) => {
    if (!t.href) return;
    if ((pathname === t.href || pathname.startsWith(`${t.href}/`)) && t.href.length > best) {
      best = t.href.length;
      activeId = t.id;
    }
  });
  if (drawerOpen) activeId = 'more';

  return (
    <View
      className="flex-row bg-side-bg border-t border-side-line px-[6px] pt-[6px]"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
      accessibilityRole="tablist"
    >
      {tabs.map((t) => {
        const active = t.id === activeId;
        const badge = badges[t.id];
        const color = active ? colors.accent : colors['side-muted'] ?? colors.muted;
        return (
          <Pressable
            key={t.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active, expanded: t.id === 'more' ? drawerOpen : undefined }}
            accessibilityLabel={t.label}
            onPress={() => (t.href ? router.navigate(t.href) : onMore?.())}
            className={`flex-1 min-h-[52px] items-center justify-center gap-[3px] rounded-[14px] ${active ? 'bg-side-pill' : ''}`}
          >
            <View>
              <Icon name={t.icon} size={21} color={color} />
              {badge ? (
                <View className="absolute -top-[6px] -right-[12px] min-w-[18px] h-[18px] px-[4px] rounded-full bg-accent items-center justify-center">
                  <Text className="text-[10px] font-bold text-on-accent">{badge}</Text>
                </View>
              ) : null}
            </View>
            <Text numberOfLines={1} className={`text-[11px] font-semibold ${active ? 'text-accent' : 'text-side-muted'}`}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
