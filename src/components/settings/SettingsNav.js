// feat(components/settings/SettingsNav): settings section list (replaces the web sidebar) and the shared form footer.
import { Pressable, Text, View } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { paths } from '@/routes/paths';
import { Icon } from '@/components/ui/Icon';
import Button from '@/components/ui/Button';

const SECTIONS = [
  { id: 'profile', label: 'Profile', desc: 'Name, avatar, timezone and locale', icon: 'user', to: paths.settingsProfile() },
  { id: 'notifications', label: 'Notifications', desc: 'Which kinds reach you, and where', icon: 'bell', to: paths.settingsNotifications() },
  { id: 'security', label: 'Security', desc: 'Password, sessions and API tokens', icon: 'lock', to: paths.settingsSecurity() },
  { id: 'appearance', label: 'Appearance', desc: 'Theme and density on this device', icon: 'sun', to: paths.settingsAppearance() },
];

// On phones the section nav is the Settings root list: each row pushes its section screen.
export default function SettingsNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View
      accessibilityRole="menu"
      accessibilityLabel="Settings sections"
      className="bg-surface border border-border rounded-card overflow-hidden"
    >
      {SECTIONS.map((s, i) => {
        const active = pathname === s.to;
        return (
          <Pressable
            key={s.id}
            accessibilityRole="link"
            accessibilityState={{ selected: active }}
            onPress={() => router.push(s.to)}
            className={`flex-row items-center gap-3 min-h-[56px] px-4 py-3 active:opacity-70 ${
              i > 0 ? 'border-t border-border' : ''
            } ${active ? 'bg-ember-soft' : ''}`}
          >
            <View className="w-[36px] h-[36px] rounded-ctl bg-well items-center justify-center">
              <Icon name={s.icon} size={18} />
            </View>
            <View className="flex-1 min-w-0">
              <Text className={`font-bold text-[13.5px] ${active ? 'text-ember-t' : 'text-foreground'}`}>{s.label}</Text>
              <Text className="text-muted text-[13px]" numberOfLines={1}>
                {s.desc}
              </Text>
            </View>
            <Icon name="chevR" size={16} />
          </Pressable>
        );
      })}
    </View>
  );
}

// Footer for a settings form. Save stays disabled until the form is dirty.
// RN has no <form> submit, so the caller passes onSave.
export function SettingsFoot({ dirty, pending = false, onDiscard, onSave, saveLabel = 'Save changes' }) {
  return (
    <View className="mt-[22px] pt-4 border-t border-border gap-[10px]">
      <View accessibilityLiveRegion="polite" className="flex-row items-center gap-2 min-h-[18px]">
        {dirty ? (
          <>
            <View className="w-[8px] h-[8px] rounded-full bg-saffron" />
            <Text className="text-muted text-[13px] font-semibold">Unsaved changes</Text>
          </>
        ) : null}
      </View>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Button variant="ghost" onClick={onDiscard} disabled={!dirty || pending}>
            Discard
          </Button>
        </View>
        <View className="flex-1">
          <Button variant="ember" onClick={onSave} loading={pending} disabled={!dirty}>
            {saveLabel}
          </Button>
        </View>
      </View>
    </View>
  );
}
