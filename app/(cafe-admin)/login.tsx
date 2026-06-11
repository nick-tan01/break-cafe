import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '../../lib/supabase';
import { colors, fonts, radius, glassCard, display, overline, primaryButton, primaryButtonText } from '../../lib/theme';
import GradientScreen from '../../components/GradientScreen';

export default function AdminLogin() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        Alert.alert('Error', error?.message ?? 'Invalid credentials. Please try again.');
        return;
      }

      const { data: ownerRows, error: ownerError } = await supabase
        .from('cafe_owners')
        .select('cafe_id, role')
        .eq('user_id', data.user.id)
        .limit(1);

      if (ownerError || !ownerRows || ownerRows.length === 0) {
        await supabase.auth.signOut();
        Alert.alert('Access denied', 'This account is not registered as a cafe owner.');
        return;
      }

      router.replace('/(cafe-admin)/dashboard');
    } catch (e) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientScreen>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.body}>
          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <Feather name="sunrise" size={26} color={colors.sage} />
            </View>
            <Text style={styles.kicker}>BREAK · CAFE PARTNERS</Text>
            <Text style={styles.headline}>Owner sign in</Text>
            <Text style={styles.sub}>Manage your bar, menu, and morning queue.</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="you@yourcafe.com"
                placeholderTextColor={colors.inkMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
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
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[primaryButton, styles.signInBtn, (!email || !password || loading) && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={!email || !password || loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={primaryButtonText}>Sign in</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.help}>Access is limited to registered cafe owners.</Text>
          </View>
        </View>

        <Text style={styles.foot}>Break · Cafe Partners</Text>
      </View>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 22,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  brand: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandMark: {
    width: 64,
    height: 64,
    borderRadius: radius.round,
    backgroundColor: colors.glassSoft,
    borderWidth: 1,
    borderColor: colors.sageBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  kicker: {
    ...overline(11),
    letterSpacing: 3,
    textAlign: 'center',
  },
  headline: {
    ...display(26),
    marginTop: 10,
    textAlign: 'center',
  },
  sub: {
    fontFamily: fonts.light,
    fontSize: 13.5,
    letterSpacing: 0.3,
    color: colors.inkSoft,
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    ...glassCard,
    padding: 20,
  },
  field: {
    backgroundColor: colors.glassSoft,
    borderWidth: 1,
    borderColor: colors.sageBorder,
    borderRadius: radius.control,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
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
  signInBtn: {
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.55,
  },
  help: {
    fontFamily: fonts.light,
    fontSize: 11.5,
    letterSpacing: 0.4,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 18,
  },
  foot: {
    ...overline(10),
    color: colors.inkMuted,
    letterSpacing: 3,
    textAlign: 'center',
  },
});
