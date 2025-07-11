import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import "../global.css"  
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/hooks/AuthProvider';

export default function RootLayout() {

  return (
    <AuthProvider>
    <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
