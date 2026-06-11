import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';

import { colors, fonts, glassCard, display, overline, primaryButton, primaryButtonText } from '../lib/theme';
import GradientScreen from '../components/GradientScreen';

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const orderIdParam = params.order_id;
  const orderId = Array.isArray(orderIdParam) ? orderIdParam[0] : orderIdParam;

  // Real order number from the database
  const formattedOrderId = orderId ?? '—';

  return (
    <GradientScreen>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.content}>
        <View style={styles.iconBadge}>
          <Feather name="check" size={36} color={colors.sage} />
        </View>

        <Text style={styles.title}>Order confirmed</Text>

        <Text style={styles.subtitle}>
          The bar has your order and is getting started.
        </Text>

        <View style={styles.card}>
          <Text style={styles.detailLabel}>Order number</Text>
          <Text style={styles.detailValue}>№ {formattedOrderId}</Text>

          <View style={styles.divider} />

          <Text style={styles.detailLabel}>Estimated pickup</Text>
          <Text style={styles.detailValue}>15–20 min</Text>
        </View>

        <TouchableOpacity
          style={[primaryButton, styles.button]}
          onPress={() => router.push('/(tabs)/orders')}
        >
          <Text style={primaryButtonText}>View order status</Text>
        </TouchableOpacity>
      </View>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  iconBadge: {
    width: 84,
    height: 84,
    borderRadius: 999,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.sageBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    ...display(26),
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.light,
    fontSize: 14.5,
    letterSpacing: 0.3,
    color: colors.inkSoft,
    textAlign: 'center',
    marginBottom: 32,
  },
  card: {
    ...glassCard,
    alignSelf: 'stretch',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  detailLabel: {
    ...overline(10.5),
    color: colors.inkMuted,
    marginBottom: 6,
  },
  detailValue: {
    ...display(19),
    letterSpacing: 1.2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.hairline,
    marginVertical: 16,
  },
  button: {
    alignSelf: 'stretch',
  },
});
