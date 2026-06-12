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
import type { ReactElement } from 'react';
import 'react-native-reanimated';

import { CartProvider } from '../lib/cart';
import { colors, fonts } from '../lib/theme';
import { registerForPushNotificationsAsync } from '../lib/notifications';
import { supabase } from '../lib/supabase';
import { stripeEnabled, stripePublishableKey } from '../lib/payments';
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

// Payments are optional: with no EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env
// this renders its children unchanged and the app behaves exactly as before.
// The Stripe SDK is require()d lazily — never imported at the top of the
// file — because its JS module touches the native module at import time,
// which would crash binaries built before the SDK was added. See
// lib/payments.ts for the matching helper side of this rule.
function PaymentsProvider({ children }: { children: ReactElement }) {
  if (!stripeEnabled || !stripePublishableKey) {
    return children;
  }
  const { StripeProvider } =
    require('@stripe/stripe-react-native') as typeof import('@stripe/stripe-react-native');
  return (
    <StripeProvider
      publishableKey={stripePublishableKey}
      merchantIdentifier="merchant.com.nicktan.breakcafe"
    >
      {children}
    </StripeProvider>
  );
}

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

  // Once a session exists, register this device for order-status pushes.
  // Fire-and-forget: registration no-ops on simulators / before EAS setup,
  // and a failure here must never block the app. The ref keeps token
  // refreshes (which re-fire onAuthStateChange) from re-registering.
  const pushRegisteredRef = useRef(false);
  useEffect(() => {
    if (session && !pushRegisteredRef.current) {
      pushRegisteredRef.current = true;
      registerForPushNotificationsAsync().catch((err) => {
        console.warn('Push registration failed:', err);
      });
    }
  }, [session]);

  if (!loaded || !authChecked) {
    return null; // Prevent flicker
  }


  return (
    <PaymentsProvider>
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
    </PaymentsProvider>
  );
}
