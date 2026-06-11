import React from 'react';
import { Tabs, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { colors, fonts } from '../../lib/theme';

export default function TabLayout() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Tabs
        screenOptions={{
          headerShown: false, // each tab renders its own Daybreak header
          tabBarActiveTintColor: colors.sage,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarStyle: {
            backgroundColor: 'rgba(255,255,255,0.94)',
            borderTopWidth: 1,
            borderTopColor: colors.hairline,
          },
          tabBarLabelStyle: {
            fontFamily: fonts.medium,
            fontSize: 9.5,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color }) => <Feather name="home" size={21} color={color} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color }) => <Feather name="search" size={21} color={color} />,
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Orders',
            tabBarIcon: ({ color }) => <Feather name="file-text" size={21} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <Feather name="user" size={21} color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}
