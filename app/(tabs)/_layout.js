// (tabs)/_layout.js
import React from 'react';
import { Drawer } from 'expo-router/drawer';

export default function TabsLayout() {
  return (
    <Drawer
      screenOptions={{
        headerStyle: { backgroundColor: '#f5f5f5' },
        headerTintColor: '#333',
        drawerStyle: { backgroundColor: '#fff' },
      }}
    >
      <Drawer.Screen name="index" options={{ drawerLabel: 'Home' }} />
      <Drawer.Screen name="admin" options={{ drawerLabel: 'admin' }} />
    </Drawer>
  );
}
