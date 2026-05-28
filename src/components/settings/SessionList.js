// feat(components/settings/SessionList): list the devices signed in to the account and let the user sign any of them out.
import { useState } from 'react';
import { Text, View } from 'react-native';
import { listSessions, revokeSession } from '@/libs/api/users';
import { useResource } from '@/utils/useResource';
import { useMutation } from '@/utils/useMutation';
import { relativeTime } from '@/utils/format';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import { Icon } from '@/components/ui/Icon';

const isMobile = (s) => /mobile|phone|tablet|android|ios|iphone|ipad/i.test(`${s.device ?? ''} ${s.os ?? ''}`);

export default function SessionList() {
  const sessions = useResource(() => listSessions(), []);
  const [revokingId, setRevokingId] = useState(null);
  const revoke = useMutation(
    async (id) => {
      await revokeSession(id);
      return true;
    },
    {
      success: 'Session signed out',
      error: (err) => err?.message || 'Could not sign that session out.',
    },
  );

  const signOut = async (s) => {
    setRevokingId(s.id);
    const res = await revoke.run(s.id);
    setRevokingId(null);
    if (res === true) {
      sessions.setData((list) => (list ?? []).filter((x) => x.id !== s.id));
    }
  };

  const list = sessions.data ?? [];

  return (
    <View className="bg-surface border border-border rounded-card p-6 gap-4">
      <View>
        <Text className="text-[17px] font-display tracking-[-0.17px] text-foreground">Sessions</Text>
        <Text className="text-muted text-[13.5px]">Devices where you are signed in. Sign one out to end its access.</Text>
      </View>

      {sessions.status === 'loading' ? (
        <View accessibilityState={{ busy: true }}>
          <Skeleton variant="feed" count={3} />
        </View>
      ) : null}

      {sessions.status === 'error' ? (
        <EmptyState tone="error" title="Sessions did not load" text={sessions.error?.message} onRetry={sessions.reload} />
      ) : null}

      {sessions.status === 'success' && !list.length ? (
        <EmptyState icon="laptop" title="No active sessions" text="Devices where you are signed in appear here." />
      ) : null}

      {sessions.status === 'success' && list.length ? (
        <View>
          {list.map((s, i) => {
            const title = `${s.os ?? 'Unknown system'} · ${s.browser ?? s.device ?? 'Browser'}`;
            const seen = relativeTime(s.lastSeenAt);
            const sub = [s.ip ?? 'Unknown address', seen ? `Last active ${seen}` : null].filter(Boolean).join(' · ');
            return (
              <View key={s.id} className={`flex-row flex-wrap items-center gap-[14px] py-[14px] ${i > 0 ? 'border-t border-border' : ''}`}>
                <View className="w-[40px] h-[40px] rounded-ctl bg-well items-center justify-center">
                  <Icon name={isMobile(s) ? 'mobile' : 'laptop'} />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="font-bold text-foreground" numberOfLines={1}>
                    {title}
                  </Text>
                  <Text className="text-muted text-[13px] mt-[2px]">{sub}</Text>
                </View>
                <Button
                  size="sm"
                  variant="soft"
                  icon="logout"
                  loading={revokingId === s.id}
                  onClick={() => signOut(s)}
                  accessibilityLabel={`Sign out ${title}`}
                >
                  Sign out
                </Button>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
