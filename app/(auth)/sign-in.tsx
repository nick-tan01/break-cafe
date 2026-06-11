import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { Alert, AppState } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { AntDesign } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

import { supabase } from '../../lib/supabase';
import { colors, fonts, radius, display, overline, primaryButton, primaryButtonText } from '../../lib/theme';
import GradientScreen from '../../components/GradientScreen';

// Initialize WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Native flow: Google returns an ID token via the app's own URL scheme
  // (the auth.expo.io proxy is deprecated), and the token is exchanged for
  // a Supabase session. Requires a dev build — Expo Go can't do this flow.
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params.id_token;
      if (!idToken) {
        Alert.alert('Error', 'Google did not return an ID token');
        return;
      }
      supabase.auth
        .signInWithIdToken({ provider: 'google', token: idToken })
        .then(({ error }) => {
          if (error) {
            Alert.alert('Error', error.message);
          }
          // On success the root layout's auth listener handles navigation.
        });
    } else if (response?.type === 'error') {
      console.error('Sign in error:', response.error);
      Alert.alert('Error', 'Could not sign in with Google');
    }
  }, [response]);

  async function handleGoogleSignIn() {
    try {
      setLoading(true);
      await promptAsync();
    } catch (error) {
      console.error('Google Sign In Error:', error);
      Alert.alert('Error', 'Could not sign in with Google');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })
    if (error) Alert.alert(error.message)
    setLoading(false)
  }

  return (
    <GradientScreen>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.brand}>
          <Text style={styles.kicker}>BREAK · LOS ANGELES</Text>
          <Text style={styles.headline}>Welcome back</Text>
          <Text style={styles.sub}>Sign in to continue to your account</Text>
        </View>

        <View style={styles.form}>
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <AntDesign name="google" size={20} color="#4285F4" />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.orLine} />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="Enter your email"
              placeholderTextColor={colors.inkMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="Enter your password"
              placeholderTextColor={colors.inkMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.link}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[primaryButton, (!email || !password) && styles.btnDisabled]}
            onPress={handleSignIn}
            disabled={!email || !password || loading}
          >
            <Text style={primaryButtonText}>Sign in</Text>
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
              <Text style={styles.link}>Sign up</Text>
            </TouchableOpacity>
          </View>

          {loading && <ActivityIndicator style={{ marginTop: 8 }} color={colors.sage} />}
        </View>
      </View>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 22,
  },
  brand: {
    marginBottom: 30,
  },
  kicker: {
    ...overline(11),
    letterSpacing: 3,
  },
  headline: {
    ...display(28),
    marginTop: 10,
  },
  sub: {
    fontFamily: fonts.light,
    fontSize: 14,
    letterSpacing: 0.3,
    color: colors.inkSoft,
    marginTop: 6,
  },
  form: {
    gap: 14,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassSoft,
    borderWidth: 1,
    borderColor: colors.sageBorder,
    borderRadius: radius.control,
    paddingVertical: 14,
  },
  googleBtnText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    letterSpacing: 0.8,
    color: colors.ink,
    marginLeft: 10,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.hairline,
  },
  orText: {
    fontFamily: fonts.light,
    fontSize: 13,
    color: colors.inkMuted,
    marginHorizontal: 14,
  },
  field: {
    backgroundColor: colors.glassSoft,
    borderWidth: 1,
    borderColor: colors.sageBorder,
    borderRadius: radius.control,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fieldLabel: {
    ...overline(10.5),
    color: colors.inkMuted,
    marginBottom: 6,
  },
  fieldInput: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.ink,
    padding: 0,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  link: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    letterSpacing: 0.4,
    color: colors.sage,
  },
  btnDisabled: {
    opacity: 0.55,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginTop: 10,
  },
  switchText: {
    fontFamily: fonts.light,
    fontSize: 13.5,
    letterSpacing: 0.3,
    color: colors.inkSoft,
  },
});
