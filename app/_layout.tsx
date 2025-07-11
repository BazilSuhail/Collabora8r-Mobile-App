import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import "../global.css"
import AsyncStorage from '@react-native-async-storage/async-storage';
import decodeJWT from '@/Config/DecodeJWT';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/hooks/AuthProvider';

export default function RootLayout() {

  return (
    <AuthProvider>
      <GestureHandlerRootView>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
