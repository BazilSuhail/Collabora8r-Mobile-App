import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import decodeJWT from '@/Config/DecodeJWT';
import { Text, View } from 'react-native';
export default function RootLayout() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        //console.log(token)
        if (token && !isTokenExpired(token)) {
          setInitialRoute('(tabs)');
        } else {
          setInitialRoute('(tabs)');
        }
      } catch (error) {
        console.error('Error checking token:', error);
        setInitialRoute('(tabs)'); // Default to login on error
      }
    };

    checkToken();
  }, []);

  // Show a loading screen until the route is determined
  if (initialRoute === null) {
    return <LoadingScreen />; // Use a custom loading screen component
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> 
    </Stack>
  );
}

function isTokenExpired(token) {
  try {
    const payload = decodeJWT(token); // Decode the token
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    return payload.exp < currentTime; // Check if token's expiration is in the past
  } catch (error) {
    console.error('Error decoding token:', error);
    return true; // Treat token as expired if decoding fails
  }
}

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Loading...</Text>
    </View>
  );
}
