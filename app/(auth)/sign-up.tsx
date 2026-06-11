import { StyleSheet, View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Feather } from '@expo/vector-icons';

import { supabase } from '../../lib/supabase';
import { colors, fonts, radius, display, overline, primaryButton, primaryButtonText } from '../../lib/theme';
import GradientScreen from '../../components/GradientScreen';

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  async function handleSignUp() {
    setLoading(true)
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
    })
    if (error) Alert.alert(error.message)
    if (!session) Alert.alert('Please check your inbox for email verification!')
    setLoading(false)
  }
// Confirm Email



  return (
    <GradientScreen>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.head}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="chevron-left" size={20} color={colors.ink} />
          </TouchableOpacity>
        </View>

        <View style={styles.brand}>
          <Text style={styles.kicker}>BREAK</Text>
          <Text style={styles.headline}>Create your account</Text>
          <Text style={styles.sub}>Sign up to start ordering from your favorite cafes</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="Enter your full name"
              placeholderTextColor={colors.inkMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
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
              placeholder="Create a password"
              placeholderTextColor={colors.inkMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
          {showConfirm && (
            <>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Confirmation Code</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Enter code sent to email"
                  placeholderTextColor={colors.inkMuted}
                  value={confirmCode}
                  onChangeText={setConfirmCode}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity style={primaryButton}>
                <Text style={primaryButtonText}>Confirm account</Text>
              </TouchableOpacity>
            </>
          )}

          {!showConfirm && (
            <TouchableOpacity
              style={[primaryButton, (!name || !email || !password) && styles.btnDisabled]}
              onPress={handleSignUp}
              disabled={!name || !email || !password}
            >
              <Text style={primaryButtonText}>Create account</Text>
            </TouchableOpacity>
          )}


          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/sign-in')}>
              <Text style={styles.link}>Sign in</Text>
            </TouchableOpacity>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {loading && <Text style={styles.loadingText}>Processing...</Text>}
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
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.sageBorder,
    backgroundColor: colors.glassSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    marginTop: 22,
    marginBottom: 28,
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
  link: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    letterSpacing: 0.4,
    color: colors.sage,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.ink,
    textAlign: 'center',
    marginTop: 8,
  },
  loadingText: {
    fontFamily: fonts.light,
    fontSize: 13,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: 8,
  },
});
