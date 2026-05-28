import '../global.css';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SplashScreen, Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { OrgProvider } from '@/context/OrgContext';
import { ShellProvider } from '@/context/ShellContext';
import { health } from '@/libs/api/auth';
import { closeAllModals } from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import ConfirmHost from '@/components/ui/ConfirmHost';
import { loadPreferences } from '@/utils/store';
import { FONTS, setTheme } from '@/config/theme';

// Keep the native splash up until fonts are ready. Ignore the error on a fast refresh re-run.
SplashScreen.preventAutoHideAsync().catch(() => {});

// Apply the saved theme (light | dark | system) as early as possible.
loadPreferences()
  .then((prefs) => setTheme(prefs?.theme))
  .catch(() => setTheme());

// Public screens a signed-in user is sent away from. Public forms (/f/...) stay open to everyone.
const AUTH_ONLY = new Set(['login', 'register']);

// The web RequireAuth guard plus App.jsx's global effects.
function AuthGate() {
  const { status } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();
  const inPublic = segments[0] === '(public)';
  const atRoot = segments.length === 0 || segments[0] === 'index';

  useEffect(() => {
    health().catch(() => {});
  }, []);

  // Close every modal and sheet on navigation (the web route rule).
  useEffect(() => {
    try {
      closeAllModals?.('route');
    } catch {
      // Modal host not mounted yet.
    }
  }, [pathname]);

  useEffect(() => {
    if (status === 'loading' || atRoot) return;
    if (status !== 'authenticated' && !inPublic) {
      // Keep where the user was going, so login can return there.
      router.replace({ pathname: '/login', params: pathname ? { from: pathname } : {} });
      return;
    }
    if (status === 'authenticated' && inPublic && AUTH_ONLY.has(segments[1])) {
      router.replace('/dashboard');
    }
  }, [status, inPublic, atRoot, segments, pathname, router]);

  if (status === 'loading' && !inPublic) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner size="lg" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

// Same nesting as the web main.jsx: Toast > Auth > Org, then the shell (drawer, finder, unread).
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONTS);
  const fontsReady = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (fontsReady) SplashScreen.hideAsync().catch(() => {});
  }, [fontsReady]);

  // The splash stays visible until fonts load (or fail, so the app never hangs on the splash).
  if (!fontsReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <AuthProvider>
            <OrgProvider>
              <ShellProvider>
                <AuthGate />
                <ConfirmHost />
              </ShellProvider>
            </OrgProvider>
          </AuthProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
