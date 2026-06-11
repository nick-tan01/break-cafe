import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Platform, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { useCart } from '../lib/cart';
import { supabase } from '../lib/supabase';

const TIP_OPTIONS = [0, 10, 15, 20];

export default function CheckoutScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
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
      <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <FontAwesome name="arrow-left" size={20} color="#007AFF" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            Checkout
          </Text>
        </View>
        <View style={styles.emptyState}>
          <FontAwesome name="shopping-basket" size={48} color="#666" />
          <Text style={[styles.emptyStateTitle, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            Your cart is empty
          </Text>
          <Text style={styles.emptyStateSubtitle}>
            Add some items from a cafe to get started.
          </Text>
          <TouchableOpacity style={styles.emptyStateButton} onPress={() => router.back()}>
            <Text style={styles.emptyStateButtonText}>Browse Cafes</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <FontAwesome name="arrow-left" size={20} color="#007AFF" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            Checkout
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            Order Summary{cafeName ? ` — ${cafeName}` : ''}
          </Text>
          {items.map((item) => (
            <View key={item.menuItemId} style={styles.orderItem}>
              <View style={styles.orderItemInfo}>
                <Text style={[styles.orderItemName, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
                  {item.name}
                </Text>
                <Text style={styles.orderItemQuantity}>x{item.quantity}</Text>
              </View>
              <Text style={styles.orderItemPrice}>
                ${(Number(item.price) * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${Number(subtotal).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tip</Text>
            <Text style={styles.summaryValue}>${tip.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            Add a Tip
          </Text>
          <View style={styles.tipRow}>
            {TIP_OPTIONS.map((pct) => (
              <TouchableOpacity
                key={pct}
                style={[styles.tipOption, tipPercent === pct && styles.tipOptionSelected]}
                onPress={() => setTipPercent(pct)}
              >
                <Text style={[styles.tipOptionText, tipPercent === pct && styles.tipOptionTextSelected]}>
                  {pct === 0 ? 'No tip' : `${pct}%`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            Pickup Details
          </Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Special Instructions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any special instructions..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.payButton,
            isProcessing && styles.payButtonDisabled
          ]}
          onPress={processOrder}
          disabled={isProcessing}
        >
          <Text style={styles.payButtonText}>
            {isProcessing ? "Processing..." : `Pay $${total.toFixed(2)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 16,
    marginBottom: 4,
  },
  orderItemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  orderItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
  },
  totalRow: {
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  tipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tipOption: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  tipOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  tipOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  tipOptionTextSelected: {
    color: '#fff',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  payButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#999',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
