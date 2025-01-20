import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import decodeJWT from '@/Config/DecodeJWT';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('token');

        if (token && !isTokenExpired(token)) {
          setInitialRoute('(tabs)');
        } else {
          setInitialRoute('authentication/login');
        }
      } catch (error) {
        console.error('Error checking token:', error);
        setInitialRoute('authentication/login');
      }
    };

    checkToken();
  }, []);

  // Show a loading screen until the route is determined
  if (initialRoute === null) {
    return <LoadingScreen />;
  }

  return (

    <GestureHandlerRootView>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name={initialRoute} options={{ headerShown: false }} />
      </Stack>

    </GestureHandlerRootView>
  );
}

function isTokenExpired(token) {
  try {
    const payload = decodeJWT(token); // Decode the token
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    return payload.exp < currentTime; // Token expired if its expiration is in the past
  } catch (error) {
    console.error('Error decoding token:', error);
    return true; // Treat token as expired if decoding fails
  }
}

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});
