import { AuthProvider } from '@/hooks/AuthProvider';
import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import "../global.css";

export default function RootLayout() {

  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}> 
        <StatusBar backgroundColor="#F3F4F6" barStyle="dark-content" />

        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
