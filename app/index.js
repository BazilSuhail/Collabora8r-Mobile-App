import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/ui/Spinner';

// "/" sends signed-in users to the dashboard (the web index redirect) and everyone else to login.
export default function Index() {
  const { status } = useAuth();
  if (status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner size="lg" />
      </View>
    );
  }
  return <Redirect href={status === 'authenticated' ? '/dashboard' : '/login'} />;
}
