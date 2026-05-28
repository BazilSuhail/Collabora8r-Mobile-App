// feat(app/(app)/settings/profile): let the user edit their name, job title, headline, avatar, timezone and locale.
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { getMe, updateMe } from '@/libs/api/users';
import { useAuth } from '@/context/AuthContext';
import { useResource } from '@/utils/useResource';
import { useMutation } from '@/utils/useMutation';
import PageHead from '@/components/layout/PageHead';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import AvatarPickerModal from '@/components/users/AvatarPickerModal';
import { userAvatarSrc } from '@/utils/media';
import { Icon } from '@/components/ui/Icon';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { SettingsFoot } from '@/components/settings/SettingsNav';

const CARD = 'bg-surface border border-border rounded-card p-5';

// Input may call onChange with a string, an RN event, or a web-like { target: { value } }.
const textOf = (e) => (typeof e === 'string' ? e : (e?.target?.value ?? e?.nativeEvent?.text ?? ''));

const FIELDS = ['displayName', 'firstName', 'lastName', 'jobTitle', 'headline', 'timezone', 'locale', 'avatarUrl'];

const LOCALES = [
  { value: 'en-US', label: 'English (United States)' },
  { value: 'en-GB', label: 'English (United Kingdom)' },
  { value: 'fr-FR', label: 'French (France)' },
  { value: 'de-DE', label: 'German (Germany)' },
  { value: 'es-ES', label: 'Spanish (Spain)' },
  { value: 'pt-BR', label: 'Portuguese (Brazil)' },
  { value: 'ja-JP', label: 'Japanese (Japan)' },
];

function timezoneList(current) {
  let zones = ['UTC'];
  try {
    if (typeof Intl.supportedValuesOf === 'function') zones = Intl.supportedValuesOf('timeZone');
  } catch {
    zones = ['UTC'];
  }
  const set = new Set(zones);
  if (current && !set.has(current)) set.add(current);
  return [...set].map((z) => ({ value: z, label: z.replace(/_/g, ' ') }));
}

const pick = (user) => {
  const out = {};
  FIELDS.forEach((f) => {
    out[f] = user?.[f] ?? '';
  });
  return out;
};

export default function ProfilePage() {
  const { refreshUser } = useAuth();
  const me = useResource(() => getMe(), []);
  const save = useMutation(updateMe, {
    success: 'Profile saved',
    error: (err) => err?.message || 'Could not save your profile.',
  });

  const [values, setValues] = useState(pick(null));
  const [baseline, setBaseline] = useState(pick(null));
  const [avatarOpen, setAvatarOpen] = useState(false);
  const user = me.data;

  const onAvatarSaved = () => {
    refreshUser().catch(() => {});
    me.reload();
  };

  useEffect(() => {
    if (!user) return;
    const next = pick(user);
    setValues(next);
    setBaseline(next);
  }, [user]);

  const timezones = useMemo(() => timezoneList(values.timezone), [values.timezone]);
  const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(baseline), [values, baseline]);
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: textOf(e) }));
  const setSelect = (key) => (value) => setValues((v) => ({ ...v, [key]: value }));

  const discard = () => setValues(baseline);

  const submit = async () => {
    if (!dirty || save.pending) return;
    if (!values.displayName.trim()) return;
    const body = {
      displayName: values.displayName.trim(),
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      jobTitle: values.jobTitle.trim(),
      headline: values.headline.trim(),
      timezone: values.timezone,
      locale: values.locale,
      avatarUrl: values.avatarUrl.trim(),
    };
    const res = await save.run(body);
    if (res) {
      const next = pick({ ...user, ...body });
      setValues(next);
      setBaseline(next);
      await refreshUser().catch(() => {});
      me.reload();
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView className="flex-1" contentContainerClassName="p-4 gap-4 pb-10" keyboardShouldPersistTaps="handled">
        <PageHead title="Profile" sub="How you appear to people in Collabor8r." />

        {me.status === 'loading' ? (
          <View className={CARD} accessibilityState={{ busy: true }}>
            <Skeleton variant="cards" count={2} />
          </View>
        ) : null}

        {me.status === 'error' ? (
          <View className={CARD}>
            <EmptyState tone="error" title="Your profile did not load" text={me.error?.message} onRetry={me.reload} />
          </View>
        ) : null}

        {me.status === 'success' ? (
          <View className={`${CARD} gap-[18px]`}>
            <View className="flex-row items-center gap-4 min-w-0">
              <Avatar
                name={values.displayName || 'You'}
                src={userAvatarSrc({ avatarKey: user?.avatarKey, avatarUrl: values.avatarUrl }) || undefined}
                size="xl"
                id={user?.id}
              />
              <View className="flex-1 min-w-0">
                <Text className="font-bold text-foreground" numberOfLines={1}>
                  {values.displayName || 'Your name'}
                </Text>
                <Text className="text-muted text-[13px]" numberOfLines={1}>
                  {user?.email ?? ''}
                </Text>
              </View>
            </View>
            <Button variant="ghost" size="sm" icon="user" onClick={() => setAvatarOpen(true)}>
              Change avatar
            </Button>

            <View className="flex-row items-center gap-3">
              <View className="w-[34px] h-[34px] rounded-ctl bg-well items-center justify-center">
                <Icon name="user" />
              </View>
              <Text className="text-[15px] font-bold text-foreground">Profile details</Text>
            </View>

            <View className="gap-4">
              <Input
                label="Display name"
                value={values.displayName}
                onChange={set('displayName')}
                hint="Required. This is the name people see."
                required
              />
              <Input label="Job title" value={values.jobTitle} onChange={set('jobTitle')} hint="Optional." />
              <Input label="First name" value={values.firstName} onChange={set('firstName')} hint="Optional." />
              <Input label="Last name" value={values.lastName} onChange={set('lastName')} hint="Optional." />
              <Input label="Headline" value={values.headline} onChange={set('headline')} hint="A short line under your name." />
              <Input
                label="Avatar URL"
                value={values.avatarUrl}
                onChange={set('avatarUrl')}
                hint="Leave empty to show your initials."
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <Select
                label="Timezone"
                value={values.timezone}
                onChange={setSelect('timezone')}
                options={timezones}
                searchable
                placeholder="Choose a timezone"
                hint="Used to show times in your local zone."
              />
              <Select
                label="Locale"
                value={values.locale}
                onChange={setSelect('locale')}
                options={LOCALES}
                placeholder="Choose a locale"
                hint="Sets the language of your interface."
              />
            </View>

            {save.fieldErrors && Object.keys(save.fieldErrors).length ? (
              <Text accessibilityLiveRegion="assertive" className="text-danger text-[13px] font-semibold">
                {Object.values(save.fieldErrors)[0]}
              </Text>
            ) : null}

            <SettingsFoot dirty={dirty} pending={save.pending} onDiscard={discard} onSave={submit} />
          </View>
        ) : null}
      </ScrollView>

      <AvatarPickerModal
        open={avatarOpen}
        onClose={() => setAvatarOpen(false)}
        currentKey={user?.avatarKey ?? null}
        onSaved={onAvatarSaved}
      />
    </KeyboardAvoidingView>
  );
}
