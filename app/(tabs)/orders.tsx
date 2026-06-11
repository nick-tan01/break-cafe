import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '../../lib/supabase';
import { colors, fonts, glassCard, display, overline } from '../../lib/theme';
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
  cafes: { name: string; profile_image_url: string | null } | null;
  order_items: OrderItemRow[];
}

const CURRENT_STATUSES: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready'];

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState<'current' | 'past'>('current');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Load orders from Supabase when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadOrders = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('orders')
            .select('*, cafes(name, profile_image_url), order_items(quantity, unit_price, menu_items(name))')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error loading orders:', error);
            return;
          }

          setOrders((data ?? []) as Order[]);
        } catch (error) {
          console.error('Error loading orders:', error);
        } finally {
          setLoading(false);
        }
      };

      loadOrders();
    }, [])
  );

  const currentOrders = orders.filter(order => CURRENT_STATUSES.includes(order.status));
  const pastOrders = orders.filter(order => order.status === 'completed' || order.status === 'cancelled');

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'Pending';
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

  const renderOrder = (order: Order) => {
    const isActive = CURRENT_STATUSES.includes(order.status);
    return (
      <TouchableOpacity
        key={order.order_id}
        style={styles.orderCard}
        onPress={() => router.push(`/order/${order.order_id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          {order.cafes?.profile_image_url ? (
            <Image
              source={{ uri: order.cafes.profile_image_url }}
              style={styles.cafeImage}
            />
          ) : (
            <View style={[styles.cafeImage, styles.cafeImagePlaceholder]}>
              <Feather name="coffee" size={18} color={colors.sage} />
            </View>
          )}
          <View style={styles.orderInfo}>
            <Text style={styles.cafeName}>{order.cafes?.name ?? 'Cafe'}</Text>
            <Text style={styles.orderDate}>
              {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={[styles.statusChip, !isActive && styles.statusChipDone]}>
            <Text style={[styles.statusChipText, !isActive && styles.statusChipTextDone]}>
              {getStatusText(order.status)}
            </Text>
          </View>
        </View>

        <View style={styles.orderItems}>
          {order.order_items.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <Text style={styles.itemName}>
                <Text style={styles.itemQty}>{item.quantity}× </Text>
                {item.menu_items?.name ?? 'Item'}
              </Text>
              <Text style={styles.itemPrice}>${(Number(item.unit_price) * Number(item.quantity)).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.totalText}>Total</Text>
          <Text style={styles.totalText}>${Number(order.total).toFixed(2)}</Text>
        </View>

        <View style={styles.viewDetailsRow}>
          <Text style={styles.viewDetailsText}>View details</Text>
          <Feather name="chevron-right" size={14} color={colors.sage} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <GradientScreen>
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <View style={styles.head}>
          <Text style={styles.kicker}>BREAK</Text>
          <Text style={styles.title}>Your orders</Text>
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabChip, selectedTab === 'current' && styles.tabChipOn]}
            onPress={() => setSelectedTab('current')}
          >
            <Text style={[styles.tabChipText, selectedTab === 'current' && styles.tabChipTextOn]}>
              Current
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabChip, selectedTab === 'past' && styles.tabChipOn]}
            onPress={() => setSelectedTab('past')}
          >
            <Text style={[styles.tabChipText, selectedTab === 'past' && styles.tabChipTextOn]}>
              Past
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {selectedTab === 'current' ? (
            currentOrders.length > 0 ? (
              currentOrders.map(renderOrder)
            ) : (
              <View style={styles.emptyState}>
                <Feather name="coffee" size={44} color={colors.inkMuted} />
                <Text style={styles.emptyTitle}>
                  {loading ? 'Loading orders…' : 'No current orders'}
                </Text>
                {!loading && (
                  <Text style={styles.emptySub}>Order ahead and it will show up here.</Text>
                )}
              </View>
            )
          ) : (
            pastOrders.length > 0 ? (
              pastOrders.map(renderOrder)
            ) : (
              <View style={styles.emptyState}>
                <Feather name="archive" size={44} color={colors.inkMuted} />
                <Text style={styles.emptyTitle}>
                  {loading ? 'Loading orders…' : 'No past orders'}
                </Text>
                {!loading && (
                  <Text style={styles.emptySub}>Finished orders live here.</Text>
                )}
              </View>
            )
          )}
        </ScrollView>
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
    marginTop: 8,
    marginBottom: 18,
  },
  kicker: {
    ...overline(11),
    letterSpacing: 3,
  },
  title: {
    ...display(28),
    marginTop: 8,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  tabChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(79,130,104,0.32)',
    backgroundColor: 'rgba(255,255,255,0.45)',
    marginHorizontal: 4,
  },
  tabChipOn: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  tabChipText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: colors.inkSoft,
  },
  tabChipTextOn: {
    color: colors.white,
    fontFamily: fonts.semibold,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  orderCard: {
    ...glassCard,
    borderRadius: 12,
    padding: 17,
    marginBottom: 13,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cafeImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
  },
  cafeImagePlaceholder: {
    backgroundColor: colors.sageTint,
    borderWidth: 1,
    borderColor: colors.sageBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: {
    flex: 1,
    marginRight: 8,
  },
  cafeName: {
    ...display(16),
    marginBottom: 3,
  },
  orderDate: {
    fontFamily: fonts.light,
    fontSize: 12,
    letterSpacing: 0.2,
    color: colors.inkSoft,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.sageBorder,
    backgroundColor: colors.sageTint,
  },
  statusChipDone: {
    borderColor: colors.hairlineFaint,
    backgroundColor: colors.glassSoft,
  },
  statusChipText: {
    ...overline(9.5),
    letterSpacing: 1.5,
  },
  statusChipTextDone: {
    color: colors.inkMuted,
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 4,
  },
  itemName: {
    flex: 1,
    fontFamily: fonts.light,
    fontSize: 14,
    letterSpacing: 0.3,
    color: colors.ink,
    marginRight: 12,
  },
  itemQty: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.sage,
  },
  itemPrice: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    paddingTop: 12,
  },
  totalText: {
    ...display(17),
    letterSpacing: 1.4,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  viewDetailsText: {
    ...overline(10.5),
    letterSpacing: 1.7,
    marginRight: 4,
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
  },
});
