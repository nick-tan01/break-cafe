import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

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
  const colorScheme = useColorScheme();
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

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'accepted':
        return '#007AFF';
      case 'preparing':
        return '#FFA500';
      case 'ready':
        return '#4CAF50';
      case 'completed':
        return '#666';
      case 'cancelled':
        return '#FF0000';
    }
  };

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

  const renderOrder = (order: Order) => (
    <TouchableOpacity
      key={order.order_id}
      style={[styles.orderCard, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }]}
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
            <FontAwesome name="coffee" size={20} color="#666" />
          </View>
        )}
        <View style={styles.orderInfo}>
          <Text style={[styles.cafeName, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            {order.cafes?.name ?? 'Cafe'}
          </Text>
          <Text style={styles.orderDate}>
            {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        {order.order_items.map((item, index) => (
          <View key={index} style={styles.orderItem}>
            <Text style={[styles.itemName, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
              {item.menu_items?.name ?? 'Item'} x{item.quantity}
            </Text>
            <Text style={styles.itemPrice}>${(Number(item.unit_price) * Number(item.quantity)).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalAmount}>${Number(order.total).toFixed(2)}</Text>
      </View>

      <View style={styles.viewDetailsContainer}>
        <Text style={styles.viewDetailsText}>View Details</Text>
        <FontAwesome name="chevron-right" size={14} color="#007AFF" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
          Orders
        </Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'current' && styles.tabSelected,
          ]}
          onPress={() => setSelectedTab('current')}
        >
          <Text style={[
            styles.tabText,
            selectedTab === 'current' && styles.tabTextSelected,
          ]}>
            Current
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'past' && styles.tabSelected,
          ]}
          onPress={() => setSelectedTab('past')}
        >
          <Text style={[
            styles.tabText,
            selectedTab === 'past' && styles.tabTextSelected,
          ]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {selectedTab === 'current' ? (
          currentOrders.length > 0 ? (
            currentOrders.map(renderOrder)
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome name="coffee" size={48} color="#666" />
              <Text style={[styles.emptyStateText, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
                {loading ? 'Loading orders...' : 'No current orders'}
              </Text>
            </View>
          )
        ) : (
          pastOrders.length > 0 ? (
            pastOrders.map(renderOrder)
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome name="history" size={48} color="#666" />
              <Text style={[styles.emptyStateText, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
                {loading ? 'Loading orders...' : 'No past orders'}
              </Text>
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabSelected: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  tabTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  orderCard: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cafeImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  cafeImagePlaceholder: {
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: {
    flex: 1,
  },
  cafeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderItems: {
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 16,
  },
  viewDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 8,
  },
  viewDetailsText: {
    color: '#007AFF',
    fontSize: 14,
    marginRight: 4,
  },
});
