import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useState, useEffect } from 'react';

import { supabase } from '../../lib/supabase';
import { colors, fonts, radius, glassCard, display, primaryButton, primaryButtonText } from '../../lib/theme';
import GradientScreen from '../../components/GradientScreen';

type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';

interface OrderItemRow {
  quantity: number;
  unit_price: number;
  menu_items: { name: string } | null;
}

interface Order {
  order_id: number;
  status: OrderStatus;
  created_at: string;
  subtotal: number;
  tip: number;
  total: number;
  pickup_time: string | null;
  notes: string | null;
  cafes: { name: string; profile_image_url: string | null } | null;
  order_items: OrderItemRow[];
}

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const orderId = Number(Array.isArray(id) ? id[0] : id);
        const { data, error } = await supabase
          .from('orders')
          .select('*, cafes(name, profile_image_url), order_items(quantity, unit_price, menu_items(name))')
          .eq('order_id', orderId)
          .single();

        if (error) {
          console.error('Error loading order:', error);
          return;
        }

        setOrder(data as Order);
      } catch (error) {
        console.error('Error loading order:', error);
      }
    };

    loadOrder();
  }, [id]);

  // Active statuses stay sage; settled orders go quiet.
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return colors.sage;
      case 'accepted':
        return colors.sage;
      case 'preparing':
        return colors.sage;
      case 'ready':
        return colors.sage;
      case 'completed':
        return colors.inkMuted;
      case 'cancelled':
        return colors.inkMuted;
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'Order Placed';
      case 'accepted':
        return 'Accepted';
      case 'preparing':
        return 'Preparing';
      case 'ready':
        return 'Ready for Pickup';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
    }
  };

  const screenOptions = {
    title: 'Order Details',
    headerStyle: {
      backgroundColor: colors.gradient[0],
    },
    headerTintColor: colors.ink,
    headerTitleStyle: {
      fontFamily: fonts.display,
      fontSize: 18,
    },
    headerShadowVisible: false,
  };

  if (!order) {
    return (
      <GradientScreen>
        <Stack.Screen options={screenOptions} />
        <View style={styles.loadingState}>
          <Feather name="loader" size={40} color={colors.inkMuted} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </GradientScreen>
    );
  }

  return (
    <GradientScreen>
      <Stack.Screen options={screenOptions} />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {order.cafes?.profile_image_url ? (
          <Image
            source={{ uri: order.cafes.profile_image_url }}
            style={styles.cafeImage}
          />
        ) : (
          <View style={[styles.cafeImage, styles.cafeImagePlaceholder]}>
            <Feather name="coffee" size={44} color={colors.inkMuted} />
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.card}>
            <Text style={styles.cafeName}>{order.cafes?.name ?? 'Cafe'}</Text>
            <View style={[styles.statusBadge, { borderColor: getStatusColor(order.status) }]}>
              <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                {getStatusText(order.status)}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Feather name="calendar" size={15} color={colors.sage} />
              <Text style={styles.infoText}>
                {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Feather name="clock" size={15} color={colors.sage} />
              <Text style={styles.infoText}>
                {order.pickup_time
                  ? `Pickup at ${new Date(order.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Pickup in 15-20 min'}
              </Text>
            </View>
            {order.notes ? (
              <View style={styles.infoRow}>
                <Feather name="file-text" size={15} color={colors.sage} />
                <Text style={styles.infoText}>{order.notes}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            {order.order_items.map((item, index) => (
              <View key={index} style={styles.orderItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.menu_items?.name ?? 'Item'}</Text>
                  <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>
                  ${(Number(item.unit_price) * Number(item.quantity)).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${Number(order.subtotal).toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tip</Text>
              <Text style={styles.summaryValue}>${Number(order.tip).toFixed(2)}</Text>
            </View>
            <View style={styles.totalSection}>
              <Text style={styles.totalText}>Total Amount</Text>
              <Text style={styles.totalText}>${Number(order.total).toFixed(2)}</Text>
            </View>
          </View>

          {order.status === 'ready' && (
            <TouchableOpacity
              style={[primaryButton, styles.pickupButton]}
              onPress={() => {
                // Handle pickup confirmation
                alert('Please show this screen to the cafe staff when picking up your order.');
              }}
            >
              <Feather name="check-circle" size={18} color={colors.white} style={styles.pickupButtonIcon} />
              <Text style={primaryButtonText}>Show to Staff for Pickup</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: fonts.light,
    fontSize: 14,
    letterSpacing: 0.4,
    color: colors.inkSoft,
    marginTop: 16,
  },
  cafeImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  cafeImagePlaceholder: {
    backgroundColor: colors.glassSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  card: {
    ...glassCard,
    borderRadius: 12,
    padding: 17,
    marginBottom: 13,
  },
  cafeName: {
    ...display(22),
    marginBottom: 10,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    backgroundColor: colors.glassSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.chip,
  },
  statusText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  infoText: {
    fontFamily: fonts.light,
    fontSize: 13.5,
    letterSpacing: 0.3,
    color: colors.ink,
    marginLeft: 10,
    flex: 1,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 14,
    letterSpacing: 2.8,
    textTransform: 'uppercase',
    color: colors.sage,
    marginBottom: 6,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineFaint,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontFamily: fonts.medium,
    fontSize: 14.5,
    letterSpacing: 0.5,
    color: colors.ink,
  },
  itemQuantity: {
    fontFamily: fonts.light,
    fontSize: 12,
    letterSpacing: 0.2,
    color: colors.inkSoft,
    marginTop: 3,
  },
  itemPrice: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  summaryLabel: {
    fontFamily: fonts.light,
    fontSize: 13.5,
    letterSpacing: 0.5,
    color: colors.inkSoft,
  },
  summaryValue: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    color: colors.inkSoft,
  },
  totalSection: {
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
  pickupButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  pickupButtonIcon: {
    marginRight: 8,
  },
});
