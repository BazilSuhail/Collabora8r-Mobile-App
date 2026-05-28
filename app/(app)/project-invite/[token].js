// feat(app/(app)/project-invite/[token]): let a signed-in user accept a project invite and open that project.
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { acceptProjectInvite } from '@/libs/api/projects';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';

export default function AcceptProjectInvitePage() {
  const { token } = useLocalSearchParams();
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const accept = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await acceptProjectInvite(String(token));
      const project = res.data;
      toast.success(project?.name ? `Joined ${project.name}` : 'Joined the project');
      const pid = project?.projectId ?? project?.id ?? project?._id;
      router.replace(pid ? `/p/${encodeURIComponent(String(pid))}` : '/projects');
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  };

  const notNow = () => router.replace('/projects');

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="flex-grow justify-center p-[16px]">
      <View className="bg-surface border border-border rounded-[18px] p-[24px] gap-[18px]">
        <View className="flex-row items-center gap-[14px]">
          <View className="items-center justify-center w-[44px] h-[44px] rounded-[14px] bg-ember-soft">
            <Icon name="project" />
          </View>
          <View className="flex-1">
            <Text className="text-foreground text-[20px] font-semibold">Project invite</Text>
            <Text className="text-muted text-[14px]">Accept to join this project and open it.</Text>
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
