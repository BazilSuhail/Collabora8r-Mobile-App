import { AuthProvider, useAuthContext } from '@/hooks/AuthProvider';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import "../global.css";

function RootLayoutContent() {
  const { userLoginStatus } = useAuthContext();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
      setIsOnboardingComplete(onboardingCompleted === 'true');
      setIsReady(true);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setIsOnboardingComplete(false);
      setIsReady(true);
    }
  };

  if (!isReady) {
    return null; // Loading state
  }

  // First time user - show onboarding
  if (!isOnboardingComplete) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
        <Stack.Screen name="authentication/login/index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    );
  }

  // Returning user - show login or dashboard based on auth status
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {userLoginStatus ? (
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="authentication/login/index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </>
      )}
    </Stack>
  );
}

export default function RootLayout() {

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <GestureHandlerRootView style={{ flex: 1 }}> 
          <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
          <RootLayoutContent />
        </GestureHandlerRootView>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
