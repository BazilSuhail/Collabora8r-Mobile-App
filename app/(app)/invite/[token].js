// feat(app/(app)/invite/[token]): let a signed-in user accept an organization invite from its emailed link.
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { acceptOrgInvite } from '@/libs/api/orgs';
import { useOrg } from '@/context/OrgContext';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';

export default function AcceptOrgInvitePage() {
  const { token } = useLocalSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { setOrgId, reload } = useOrg();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const accept = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await acceptOrgInvite(String(token));
      if (res.data?.orgId) await setOrgId(res.data.orgId);
      reload();
      toast.success('Joined the organization');
      router.replace('/projects');
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  };

  const notNow = () => router.replace('/dashboard');

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="flex-grow justify-center p-[16px]">
      <View className="bg-surface border border-border rounded-[18px] p-[24px] gap-[18px]">
        <View className="flex-row items-center gap-[14px]">
          <View className="items-center justify-center w-[44px] h-[44px] rounded-[14px] bg-ember-soft">
            <Icon name="building" />
          </View>
          <View className="flex-1">
            <Text className="text-foreground text-[20px] font-semibold">Organization invite</Text>
            <Text className="text-muted text-[14px]">Accept to join this organization and see its projects.</Text>
          </View>
        </View>

        {error ? (
          <EmptyState
            tone="error"
            icon="alert"
            title="This invite can't be accepted"
            text={error.message || 'The invite may have expired or already been used.'}
          />
        ) : null}

        <View className="flex-row flex-wrap items-center justify-end gap-[10px]">
          <Button variant="ghost" onClick={notNow} onPress={notNow}>
            Not now
          </Button>
          <Button variant="ember" loading={pending} onClick={accept} onPress={accept}>
            Accept invite
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
