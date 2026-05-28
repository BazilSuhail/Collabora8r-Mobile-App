// feat(app/(app)/settings/notifications): choose which notification kinds reach the user on each channel.
// The web kind x channel table becomes one card row per kind with a switch per channel.
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { getPrefs, putPrefs } from '@/libs/api/users';
import { useResource } from '@/utils/useResource';
import { useMutation } from '@/utils/useMutation';
import { NOTIFICATION_CHANNELS, NOTIFICATION_KINDS } from '@/metadata/settings';
import PageHead from '@/components/layout/PageHead';
import Badge from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import Switch from '@/components/ui/Switch';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { SettingsFoot } from '@/components/settings/SettingsNav';

const CARD = 'bg-surface border border-border rounded-card p-5';

const keyOf = (kind, channel) => `${kind}|${channel}`;

// Maps the server list to { "kind|channel": enabled } and keeps quiet hours for the PUT.
function toDraft(list) {
  const enabled = {};
  const quiet = {};
  (Array.isArray(list) ? list : []).forEach((p) => {
    enabled[keyOf(p.kind, p.channel)] = Boolean(p.enabled);
    quiet[keyOf(p.kind, p.channel)] = p.quietHours ?? null;
  });
  return { enabled, quiet };
}

export default function NotificationPrefsPage() {
  const prefs = useResource(() => getPrefs(), []);
  const save = useMutation(putPrefs, {
    success: 'Preferences saved',
    error: (err) => err?.message || 'Could not save your preferences.',
  });

  const [draft, setDraft] = useState({ enabled: {}, quiet: {} });
  const [baseline, setBaseline] = useState({ enabled: {}, quiet: {} });

  useEffect(() => {
    if (prefs.status !== 'success') return;
    const next = toDraft(prefs.data);
    setDraft(next);
    setBaseline(next);
  }, [prefs.status, prefs.data]);

  const dirty = useMemo(() => JSON.stringify(draft.enabled) !== JSON.stringify(baseline.enabled), [draft, baseline]);

  const isOn = (kind, channel) => draft.enabled[keyOf(kind, channel)] !== false;

  const toggle = (kind, channel) => (next) =>
    setDraft((d) => ({ ...d, enabled: { ...d.enabled, [keyOf(kind, channel)]: next } }));

  const discard = () => setDraft(baseline);

  const totalPrefs = NOTIFICATION_KINDS.length * NOTIFICATION_CHANNELS.length;
  const onPrefs = NOTIFICATION_KINDS.reduce(
    (sum, k) => sum + NOTIFICATION_CHANNELS.filter((c) => isOn(k.id, c.id)).length,
    0,
  );

  const submit = async () => {
    if (!dirty || save.pending) return;
    const body = {
      prefs: NOTIFICATION_KINDS.flatMap((k) =>
        NOTIFICATION_CHANNELS.map((c) => {
          const key = keyOf(k.id, c.id);
          return {
            channel: c.id,
            kind: k.id,
            enabled: draft.enabled[key] !== false,
            quietHours: draft.quiet[key] ?? null,
          };
        }),
      ),
    };
    const res = await save.run(body);
    if (res) {
      const next = toDraft(res.data);
      setDraft(next);
      setBaseline(next);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 gap-4 pb-10" keyboardShouldPersistTaps="handled">
      <PageHead title="Notifications" sub="Choose which kinds of notification reach you, and where." />

      {prefs.status === 'loading' ? (
        <View className={CARD} accessibilityState={{ busy: true }}>
          <Skeleton variant="rows" count={8} cols={3} />
        </View>
      ) : null}

      {prefs.status === 'error' ? (
        <View className={CARD}>
          <EmptyState tone="error" title="Preferences did not load" text={prefs.error?.message} onRetry={prefs.reload} />
        </View>
      ) : null}

      {prefs.status === 'success' && NOTIFICATION_KINDS.length === 0 ? (
        <View className={CARD}>
          <EmptyState icon="bell" title="No notification kinds" text="There is nothing to configure yet." />
        </View>
      ) : null}

      {prefs.status === 'success' && NOTIFICATION_KINDS.length > 0 ? (
        <View className={`${CARD} gap-4`}>
          <View className="flex-row flex-wrap items-center justify-between gap-3">
            <View className="flex-row items-center gap-3 flex-1 min-w-0">
              <View className="w-[34px] h-[34px] rounded-ctl bg-well items-center justify-center">
                <Icon name="bell" />
              </View>
              <Text className="text-[15px] font-bold text-foreground">Channels by notification</Text>
            </View>
            <Badge tone="iris">
              {onPrefs} of {totalPrefs} on
            </Badge>
          </View>

          <View>
            {NOTIFICATION_KINDS.map((k, i) => (
              <View key={k.id} className={`py-3 gap-2 ${i > 0 ? 'border-t border-border' : ''}`}>
                <View>
                  <Text className="font-bold text-foreground">{k.label}</Text>
                  {k.desc ? <Text className="text-muted text-[12.5px]">{k.desc}</Text> : null}
                </View>
                <View className="flex-row flex-wrap gap-x-5 gap-y-2">
                  {NOTIFICATION_CHANNELS.map((c) => (
                    <View key={c.id} className="flex-row items-center gap-2">
                      <Switch
                        checked={isOn(k.id, c.id)}
                        onChange={toggle(k.id, c.id)}
                        label={`${k.label} on ${c.label}`}
                        hideLabel
                      />
                      <Text className="text-foreground text-[13px] font-semibold">{c.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>

          <SettingsFoot dirty={dirty} pending={save.pending} onDiscard={discard} onSave={submit} saveLabel="Save preferences" />
        </View>
      ) : null}
    </ScrollView>
  );
}
