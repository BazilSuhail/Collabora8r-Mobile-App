import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import "../global.css"
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/hooks/AuthProvider';
import { StatusBar } from 'react-native';

export default function RootLayout() {

  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* <StatusBar backgroundColor="#ffffff" barStyle="dark-content" /> */}
        <StatusBar backgroundColor="#F9FAFB" barStyle="dark-content" />

        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
