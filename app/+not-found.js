// feat(app/+not-found): show a friendly not-found state with a way back to the dashboard.
import { View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

export default function NotFoundPage() {
  const router = useRouter();
  const { status } = useAuth();
  const signedIn = status === "authenticated";

  const body = (
    <Animated.View entering={FadeInDown.duration(320)}>
      <EmptyState
        icon="search"
        title="Page not found"
        text="The page you are looking for does not exist or was moved."
        action={
          <Button variant="ember" icon="home" onPress={() => router.replace("/dashboard")}>
            Back to dashboard
          </Button>
        }
      />
    </Animated.View>
  );

  return (
    <View className="flex-1 justify-center bg-background px-4">
      {signedIn ? (
        <View className="rounded-2xl bg-surface border border-border p-6">{body}</View>
      ) : (
        <View className="gap-[18px] items-center">{body}</View>
      )}
    </View>
  );
}
