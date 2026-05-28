import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { paths } from '@/routes/paths';
import { AVATAR_IMAGES } from '@/config/theme';
import { Icon } from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import ActionSheet from '@/components/shared/ActionSheet';
import OrgSwitcher from './OrgSwitcher';
import ProjectSwitcher from './ProjectSwitcher';
import { activeIdFor, buildNavGroups } from './shellRoutes';
import { useThemeColors } from './useThemeColors';

const capitalise = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : '');

// Secondary line under a nav label.
function detailFor(id, badge, role) {
  if (id === 'my-work' && badge) return `${badge} assigned to you`;
  if (id === 'overview' && role) return `Your role: ${capitalise(role)}`;
  return null;
}

// Preset avatar (bundled asset) first, then an uploaded URL, then initials.
function MeAvatar({ user }) {
  const preset = AVATAR_IMAGES[user?.avatarKey];
  if (preset) return <Image source={preset} style={{ width: 36, height: 36, borderRadius: 18 }} accessibilityIgnoresInvertColors />;
  return <Avatar name={user?.displayName ?? user?.email ?? 'Me'} src={user?.avatarUrl ?? null} size="md" />;
}

// Main, project and settings links. Project items show only with a project. Role gating hides entries.
// sheet=true lays items out in two columns (More sheet).
export function SideNav({ pathname = '', pid, role, badges = {}, sheet = false, onNavigate }) {
  const router = useRouter();
  const colors = useThemeColors();
  const groups = buildNavGroups({ pid, role });
  const activeId = activeIdFor(groups.flatMap((g) => g.items), pathname);

  return (
    <View accessibilityRole="menu" className="gap-[14px]">
      {groups.map((g) => (
        <View key={g.id} className="gap-[6px]">
          <Text className="px-[6px] text-[11.5px] font-bold uppercase tracking-[0.08em] text-side-muted">{g.label}</Text>
          <View className={sheet ? 'flex-row flex-wrap' : ''}>
            {g.items.map((item) => {
              const active = item.id === activeId;
              const badge = badges[item.id];
              const detail = detailFor(item.id, badge, role);
              return (
                <View key={item.id} className={sheet ? 'w-1/2 p-[3px]' : 'py-[2px]'}>
                  <Pressable
                    accessibilityRole="link"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      onNavigate?.();
                      router.navigate(item.href);
                    }}
                    className={`flex-row items-center gap-[10px] min-h-[46px] px-[10px] rounded-[12px] ${active ? 'bg-side-pill' : 'active:bg-side-pill'}`}
                  >
                    <Icon name={item.icon} size={18} color={active ? colors.accent : colors['side-muted'] ?? colors.muted} />
                    <View className="flex-1 min-w-0">
                      <Text numberOfLines={1} className={`text-[14px] font-semibold ${active ? 'text-side-text' : 'text-side-text'}`}>
                        {item.label}
                      </Text>
                      {detail ? (
                        <Text numberOfLines={1} className="text-[11.5px] text-side-muted">
                          {detail}
                        </Text>
                      ) : null}
                    </View>
                    {badge ? (
                      <View className="min-w-[20px] h-[20px] px-[5px] rounded-full bg-accent items-center justify-center">
                        <Text className="text-[11px] font-bold text-on-accent">{badge}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

// Goal card: first open goal of the current project. Hidden when there is none.
export function SideGoal({ goal, pid, onNavigate }) {
  const router = useRouter();
  if (!goal || !pid) return null;
  const target = Number(goal.target) || 0;
  const current = Number(goal.current) || 0;
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const unit = goal.unit ? ` ${goal.unit}` : '';
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Goal: ${goal.title ?? 'Project goal'}`}
      onPress={() => {
        onNavigate?.();
        router.navigate(paths.goals(pid));
      }}
      className="gap-[8px] p-[14px] rounded-[15px] border border-side-line bg-side-pill"
    >
      <View className="flex-row justify-between">
        <Text className="text-[12.5px] font-semibold text-side-muted">Goal</Text>
        <Text className="text-[12.5px] font-bold text-side-text">{pct}%</Text>
      </View>
      <View className="h-[6px] rounded-full bg-side-line overflow-hidden">
        <View className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </View>
      <Text numberOfLines={1} className="text-[11.5px] text-side-muted">
        {goal.title ?? 'Goal'}: {current} of {target}
        {unit}
      </Text>
    </Pressable>
  );
}

// Account row: profile, settings, theme and sign out in an action sheet.
export function AccountMenu({ user, theme, onSignOut, onNavigate }) {
  const router = useRouter();
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);
  const dark = theme?.resolved === 'dark';
  const go = (href) => {
    onNavigate?.();
    router.navigate(href);
  };
  const items = [
    { id: 'profile', label: 'Profile', icon: 'user', onSelect: () => go(paths.settingsProfile()) },
    { id: 'settings', label: 'Settings', icon: 'settings', onSelect: () => go(paths.settings()) },
    { id: 'theme', label: dark ? 'Switch to light theme' : 'Switch to dark theme', icon: 'moon', onSelect: () => theme?.toggle() },
    'separator',
    { id: 'signout', label: 'Sign out', icon: 'logout', danger: true, onSelect: () => onSignOut?.() },
  ];
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Account menu"
        onPress={() => setOpen(true)}
        className="flex-row items-center gap-[10px] p-[8px] rounded-[14px] active:bg-side-pill"
      >
        <MeAvatar user={user} />
        <View className="flex-1 min-w-0">
          <Text numberOfLines={1} className="text-[13.5px] font-bold text-side-text">
            {user?.displayName ?? 'Signed in'}
          </Text>
          {user?.jobTitle ? (
            <Text numberOfLines={1} className="text-[12px] text-side-muted">
              {user.jobTitle}
            </Text>
          ) : null}
        </View>
        <Icon name="upDown" size={16} color={colors['side-muted'] ?? colors.muted} />
      </Pressable>
      <ActionSheet open={open} onClose={() => setOpen(false)} title="Account" items={items} />
    </>
  );
}

// Tablet-style side rail. Phones use the tab bar and the More sheet instead; kept for parity.
export default function Sidebar({ pathname, pid, project, orgId, personal, role, badges, openSearch, user, goal, theme, onSignOut }) {
  const colors = useThemeColors();
  return (
    <ScrollView className="bg-side-bg" contentContainerClassName="gap-[14px] p-[12px]">
      <Text className="text-[18px] font-bold text-side-text">
        Collabor<Text className="text-accent">8</Text>r
      </Text>
      <Pressable
        onPress={openSearch}
        accessibilityRole="button"
        className="flex-row items-center gap-[10px] min-h-[44px] px-[10px] rounded-[12px] border border-side-line"
      >
        <Icon name="search" size={16} color={colors['side-muted'] ?? colors.muted} />
        <Text className="text-[13px] font-semibold text-side-muted">Search</Text>
      </Pressable>
      <View className="gap-[8px]">
        <OrgSwitcher personal={personal} />
        <ProjectSwitcher project={project} orgId={orgId} personal={personal} />
      </View>
      <SideNav pathname={pathname} pid={pid} role={role} badges={badges} />
      <SideGoal goal={goal} pid={pid} />
      <AccountMenu user={user} theme={theme} onSignOut={onSignOut} />
    </ScrollView>
  );
}
