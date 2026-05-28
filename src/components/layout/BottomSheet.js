import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { paths } from '@/routes/paths';
import OrgSwitcher from './OrgSwitcher';
import ProjectSwitcher from './ProjectSwitcher';
import { AccountMenu, SideGoal, SideNav } from './Sidebar';
import { useThemeColors } from './useThemeColors';

// The phone "More" sheet: brand, search, switchers, grouped nav (NAV_GROUPS), goal card and account.
export default function BottomSheet({
  open,
  onClose,
  pathname,
  pid,
  project,
  orgId,
  personal,
  role,
  badges,
  goal,
  user,
  theme,
  openSearch,
  onSignOut,
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  const muted = colors['side-muted'] ?? colors.muted;

  return (
    <Modal visible={Boolean(open)} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable className="flex-1 bg-backdrop" onPress={onClose} accessibilityLabel="Close menu" />
      <View
        className="bg-side-bg rounded-t-[24px] border border-side-line"
        style={{ maxHeight: '88%', paddingBottom: Math.max(insets.bottom, 12) }}
        accessibilityLabel="Sidebar"
      >
        <View className="self-center w-[40px] h-[5px] rounded-full bg-side-line mt-[10px] mb-[6px]" />
        <ScrollView contentContainerClassName="gap-[14px] px-[14px] pb-[8px]" showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center justify-between">
            <Pressable
              accessibilityRole="link"
              onPress={() => {
                onClose?.();
                router.navigate(paths.dashboard());
              }}
            >
              <Text className="text-[19px] font-bold text-side-text">
                Collabor<Text className="text-accent">8</Text>r
              </Text>
            </Pressable>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} className="w-[40px] h-[40px] items-center justify-center">
              <Icon name="close" size={20} color={muted} />
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              onClose?.();
              openSearch?.();
            }}
            className="flex-row items-center gap-[10px] min-h-[44px] px-[12px] rounded-[12px] border border-side-line active:bg-side-pill"
          >
            <Icon name="search" size={16} color={muted} />
            <Text className="text-[14px] font-semibold text-side-muted">Search</Text>
          </Pressable>

          <View className="flex-row gap-[8px]">
            <View className="flex-1">
              <OrgSwitcher personal={personal} onNavigate={onClose} />
            </View>
            <View className="flex-1">
              <ProjectSwitcher project={project} orgId={orgId} personal={personal} onNavigate={onClose} />
            </View>
          </View>

          <SideNav pathname={pathname} pid={pid} role={role} badges={badges} sheet onNavigate={onClose} />
          <SideGoal goal={goal} pid={pid} onNavigate={onClose} />
          <AccountMenu user={user} theme={theme} onSignOut={onSignOut} onNavigate={onClose} />
        </ScrollView>
      </View>
    </Modal>
  );
}
