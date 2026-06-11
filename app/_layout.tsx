import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Marcellus_400Regular } from '@expo-google-fonts/marcellus';
import {
  Jost_300Light,
  Jost_400Regular,
  Jost_500Medium,
  Jost_600SemiBold,
} from '@expo-google-fonts/jost';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import 'react-native-reanimated';

import { CartProvider } from '../lib/cart';
import { colors, fonts } from '../lib/theme';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js'

// Daybreak is a light-only design; navigation chrome follows lib/theme.ts.
const DaybreakNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.sage,
    background: '#EDF0F7',
    card: '#F2F1F8',
    text: colors.ink,
    border: colors.hairline,
    notification: colors.sage,
  },
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Marcellus_400Regular,
    Jost_300Light,
    Jost_400Regular,
    Jost_500Medium,
    Jost_600SemiBold,
  });

  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // The auth listener below runs outside React's render cycle, so it reads
  // the current route group through a ref to avoid a stale closure.
  const segments = useSegments();
  const segmentsRef = useRef(segments);
  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setAuthChecked(true);
      SplashScreen.hideAsync();

      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/sign-in');
      }
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Cafe owners sign in inside the (cafe-admin) group; don't yank them
      // back to the customer tabs when their session starts.
      const inAdmin = segmentsRef.current[0] === '(cafe-admin)';
      if (session) {
        if (!inAdmin) router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/sign-in');
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!loaded || !authChecked) {
    return null; // Prevent flicker
  }


  return (
    <ThemeProvider value={DaybreakNavTheme}>
      <CartProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#EDF0F7' },
            headerTintColor: colors.ink,
            headerTitleStyle: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
            headerShadowVisible: false,
            // back button shows only the chevron — never the previous route's
            // internal name like "(tabs)"
            headerBackButtonDisplayMode: 'minimal',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(cafe-admin)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="dark" />
      </CartProvider>
    </ThemeProvider>
  );
}
