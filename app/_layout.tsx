import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from 'react-native';

import { CartProvider } from '../lib/cart';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js'


// add email verification with URL

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
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
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <CartProvider>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
            },
            headerTintColor: colorScheme === 'dark' ? '#fff' : '#000',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </CartProvider>
    </ThemeProvider>
  );
}
