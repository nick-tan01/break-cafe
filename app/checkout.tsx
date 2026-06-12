import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCart } from '../lib/cart';
import { supabase } from '../lib/supabase';
import { stripeEnabled, createPaymentIntent, presentStripePaymentSheet } from '../lib/payments';
import { colors, fonts, glassCard, display, overline, primaryButton, primaryButtonText } from '../lib/theme';
import GradientScreen from '../components/GradientScreen';

const TIP_OPTIONS = [0, 10, 15, 20];

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notes, setNotes] = useState('');
  const [tipPercent, setTipPercent] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const { cafeId, cafeName, items, subtotal, clearCart } = useCart();

  const tip = Number((Number(subtotal) * tipPercent / 100).toFixed(2));
  const total = Number((Number(subtotal) + tip).toFixed(2));

  const processOrder = async () => {
    if (isProcessing) return;
    if (cafeId == null || items.length === 0) return;

    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Order failed', 'You need to be signed in to place an order.');
        return;
      }

      // Payment first, order second — but only when Stripe is configured.
      // Without a publishable key this whole block is skipped and checkout
      // behaves exactly as before (order placed directly, no payment).
      if (stripeEnabled) {
        // The edge function reprices the cart from the database — we send
        // ids, quantities, and the tip percent, never prices — so a tampered
        // client can't change what it pays.
        let clientSecret: string;
        try {
          ({ clientSecret } = await createPaymentIntent({
            cafeId,
            items: items.map((item) => ({
              menu_item_id: item.menuItemId,
              quantity: item.quantity,
            })),
            tipPercent,
          }));
        } catch (error) {
          console.error('Error preparing payment:', error);
          Alert.alert('Payment failed', "We couldn't start your payment. Please try again.");
          return;
        }

        const outcome = await presentStripePaymentSheet(clientSecret);
        if (outcome === 'canceled') {
          // The user closed the sheet on purpose — stop quietly and hand
          // the button back (finally re-enables it).
          return;
        }
        if (outcome === 'failed') {
          Alert.alert('Payment failed', "Your card wasn't charged. Please try again.");
          return;
        }
      }

      // single transactional RPC — order + items succeed or fail together,
      // so a failed item insert can no longer strand an empty pending order
      const { data: orderId, error: orderError } = await supabase.rpc('place_order', {
        cafe_id: cafeId,
        notes: notes.trim() ? notes.trim() : null,
        subtotal,
        tip,
        total,
        items: items.map((item) => ({
          menu_item_id: item.menuItemId,
          quantity: item.quantity,
          unit_price: item.price,
          customizations: item.customizations ?? null,
        })),
      });

      if (orderError || orderId == null) {
        Alert.alert('Order failed', 'There was an error placing your order. Please try again.');
        return;
      }

      clearCart();

      router.push({
        pathname: `/order-confirmation`,
        params: { order_id: String(orderId) },
      });
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Order failed', 'There was an error processing your order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <GradientScreen>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
          <View style={styles.head}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Feather name="chevron-left" size={20} color={colors.ink} />
            </TouchableOpacity>
            <Text style={styles.headTitle}>Checkout</Text>
          </View>
          <View style={styles.emptyState}>
            <Feather name="coffee" size={44} color={colors.inkMuted} />
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySub}>Add something from a cafe to get started.</Text>
            <TouchableOpacity style={[primaryButton, styles.emptyBtn]} onPress={() => router.back()}>
              <Text style={primaryButtonText}>Browse cafes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </GradientScreen>
    );
  }

  return (
    <GradientScreen>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <View style={styles.head}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="chevron-left" size={20} color={colors.ink} />
          </TouchableOpacity>
          <Text style={styles.headTitle}>Checkout</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <View style={styles.pickupRow}>
              <View style={styles.pickupBadge}>
                <Feather name="clock" size={19} color={colors.sage} />
              </View>
              <View style={styles.pickupInfo}>
                <Text style={styles.pickupTitle}>
                  Pickup{cafeName ? ` at ${cafeName}` : ''}
                </Text>
                <Text style={styles.pickupSub}>Ready in about 10 min</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardHeading}>Your order</Text>
            {items.map((item) => (
              <View key={item.menuItemId} style={styles.orderRow}>
                <Text style={styles.orderName}>
                  <Text style={styles.orderQty}>{item.quantity}× </Text>
                  {item.name}
                </Text>
                <Text style={styles.orderPrice}>
                  ${(Number(item.price) * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.noteField}>
            <Feather name="edit-3" size={16} color={colors.inkMuted} />
            <TextInput
              style={styles.noteInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="A note for the bar…"
              placeholderTextColor={colors.inkMuted}
              multiline
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.tipTitle}>For the barista</Text>
            <Text style={styles.tipSub}>100% goes to the crew</Text>
            <View style={styles.tipRow}>
              {TIP_OPTIONS.map((pct) => (
                <TouchableOpacity
                  key={pct}
                  style={[styles.tipPill, tipPercent === pct && styles.tipPillOn]}
                  onPress={() => setTipPercent(pct)}
                >
                  <Text style={[styles.tipPillText, tipPercent === pct && styles.tipPillTextOn]}>
                    {pct === 0 ? 'No tip' : `${pct}%`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>Subtotal</Text>
              <Text style={styles.sumValue}>${Number(subtotal).toFixed(2)}</Text>
            </View>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>Tip</Text>
              <Text style={styles.sumValue}>${tip.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalText}>Total</Text>
              <Text style={styles.totalText}>${total.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
          <TouchableOpacity
            style={[primaryButton, isProcessing && styles.payBtnDisabled]}
            onPress={processOrder}
            disabled={isProcessing}
          >
            <Text style={primaryButtonText}>
              {isProcessing ? 'Processing…' : `Pay $${total.toFixed(2)}`}
            </Text>
          </TouchableOpacity>
          <Text style={styles.payNote}>Your pickup code will be waiting at the bar.</Text>
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
    marginBottom: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.sageBorder,
    backgroundColor: colors.glassSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headTitle: {
    ...display(21),
    letterSpacing: 2.5,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  card: {
    ...glassCard,
    borderRadius: 12,
    padding: 17,
    marginBottom: 13,
  },
  pickupRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickupBadge: {
    width: 42,
    height: 42,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.sageBorder,
    backgroundColor: colors.sageTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupInfo: {
    flex: 1,
    marginLeft: 13,
  },
  pickupTitle: {
    fontFamily: fonts.medium,
    fontSize: 14.5,
    letterSpacing: 0.7,
    color: colors.ink,
  },
  pickupSub: {
    fontFamily: fonts.light,
    fontSize: 12,
    letterSpacing: 0.2,
    color: colors.inkSoft,
    marginTop: 3,
  },
  cardHeading: {
    fontFamily: fonts.display,
    fontSize: 14,
    letterSpacing: 2.8,
    textTransform: 'uppercase',
    color: colors.sage,
    marginBottom: 6,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 9,
  },
  orderName: {
    flex: 1,
    fontFamily: fonts.light,
    fontSize: 14,
    letterSpacing: 0.3,
    color: colors.ink,
    marginRight: 12,
  },
  orderQty: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.sage,
  },
  orderPrice: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
  },
  noteField: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.glassSoft,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.sageBorder,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 13,
  },
  noteInput: {
    flex: 1,
    fontFamily: fonts.light,
    fontSize: 13.5,
    color: colors.ink,
    marginLeft: 10,
    padding: 0,
    minHeight: 38,
    textAlignVertical: 'top',
  },
  tipTitle: {
    fontFamily: fonts.medium,
    fontSize: 14.5,
    letterSpacing: 0.8,
    color: colors.ink,
  },
  tipSub: {
    fontFamily: fonts.light,
    fontSize: 11.5,
    letterSpacing: 0.3,
    color: colors.inkSoft,
    marginTop: 3,
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: 'row',
  },
  tipPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(79,130,104,0.35)',
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 4,
  },
  tipPillOn: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  tipPillText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    letterSpacing: 0.6,
    color: colors.inkSoft,
  },
  tipPillTextOn: {
    color: colors.white,
    fontFamily: fonts.semibold,
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  sumLabel: {
    fontFamily: fonts.light,
    fontSize: 13.5,
    letterSpacing: 0.5,
    color: colors.inkSoft,
  },
  sumValue: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    color: colors.inkSoft,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    marginTop: 8,
    paddingTop: 12,
  },
  totalText: {
    ...display(17),
    letterSpacing: 1.4,
  },
  footer: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  payBtnDisabled: {
    opacity: 0.55,
  },
  payNote: {
    fontFamily: fonts.light,
    fontSize: 11,
    letterSpacing: 0.7,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: 11,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyTitle: {
    ...display(20),
    marginTop: 16,
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: fonts.light,
    fontSize: 14,
    letterSpacing: 0.3,
    color: colors.inkSoft,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyBtn: {
    paddingHorizontal: 32,
  },
});
