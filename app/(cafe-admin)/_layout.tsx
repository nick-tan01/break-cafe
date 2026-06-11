import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';

import { supabase } from '../../lib/supabase';
import { colors, fonts } from '../../lib/theme';

export default function CafeAdminLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [checked, setChecked] = useState(false);

  // Admin screens require a signed-in session; the login screen handles
  // the cafe-owner role check itself.
  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      const onLogin = segments[segments.length - 1] === 'login';
      if (!session && !onLogin) {
        router.replace('/(cafe-admin)/login');
      }
      setChecked(true);
    })();
    return () => { active = false; };
  }, [segments]);

  if (!checked) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#EDF0F7' },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
        headerShadowVisible: false,
        // back button shows only the chevron — never the previous route's
        // internal name like "(cafe-admin)"
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen
        name="dashboard"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="orders"
        options={{
          title: 'Orders',
        }}
      />
      <Stack.Screen
        name="menu"
        options={{
          title: 'Menu',
        }}
      />
      <Stack.Screen
        name="analytics"
        options={{
          title: 'Analytics',
        }}
      />
      <Stack.Screen
        name="reviews"
        options={{
          title: 'Reviews',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
    </Stack>
  );
}
