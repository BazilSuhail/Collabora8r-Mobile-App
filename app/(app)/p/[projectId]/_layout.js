import { Text, View, Pressable } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ProjectProvider, useProject } from '@/context/ProjectContext';
import Spinner from '@/components/ui/Spinner';
import { paths } from '@/routes/paths';

// Waits for the first project load. Errors (not found, no access) get a retry and a way out.
function ProjectGate() {
  const { project, status, error, reload } = useProject();
  const router = useRouter();

  if (!project && status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner size="lg" label="Loading project" />
      </View>
    );
  }

  if (!project && status === 'error') {
    const denied = error?.status === 403 || error?.status === 404;
    return (
      <View className="flex-1 items-center justify-center gap-[12px] bg-background px-[24px]">
        <Text className="text-[18px] font-bold text-foreground text-center">
          {denied ? 'Project not available' : 'Could not load this project'}
        </Text>
        <Text className="text-[14px] text-muted text-center">
          {denied ? 'It may have been removed, or you are not a member.' : (error?.message ?? 'Check your connection and try again.')}
        </Text>
        <View className="flex-row gap-[10px]">
          {!denied ? (
            <Pressable onPress={reload} accessibilityRole="button" className="min-h-[44px] px-[16px] rounded-[12px] bg-accent items-center justify-center">
              <Text className="text-[14px] font-bold text-on-accent">Try again</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => router.replace(paths.projects())}
            accessibilityRole="button"
            className="min-h-[44px] px-[16px] rounded-[12px] border border-border items-center justify-center"
          >
            <Text className="text-[14px] font-semibold text-foreground">All projects</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }} />;
}

// Project routes (/p/[projectId]/...). Same as the client's RequireProject: a fresh ProjectProvider per id.
export default function ProjectLayout() {
  const { projectId } = useLocalSearchParams();
  const id = Array.isArray(projectId) ? projectId[0] : projectId;
  return (
    <ProjectProvider key={id} projectId={id}>
      <ProjectGate />
    </ProjectProvider>
  );
}
