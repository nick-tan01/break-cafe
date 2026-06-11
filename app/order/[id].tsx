import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
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
  notes: string | null;
  cafes: { name: string; profile_image_url: string | null } | null;
  order_items: OrderItemRow[];
}

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
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

  if (!order) {
    return (
      <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }]}>
        <Stack.Screen
          options={{
            title: 'Order Details',
            headerStyle: {
              backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
            },
            headerTintColor: colorScheme === 'dark' ? '#fff' : '#000',
          }}
        />
        <View style={styles.loadingState}>
          <FontAwesome name="spinner" size={48} color="#666" />
          <Text style={[styles.loadingText, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            Loading order details...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }]}>
      <Stack.Screen
        options={{
          title: 'Order Details',
          headerStyle: {
            backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
          },
          headerTintColor: colorScheme === 'dark' ? '#fff' : '#000',
        }}
      />

      <ScrollView style={styles.content}>
        {order.cafes?.profile_image_url ? (
          <Image
            source={{ uri: order.cafes.profile_image_url }}
            style={styles.cafeImage}
          />
        ) : (
          <View style={[styles.cafeImage, styles.cafeImagePlaceholder]}>
            <FontAwesome name="coffee" size={48} color="#666" />
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.cafeName, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            {order.cafes?.name ?? 'Cafe'}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <FontAwesome name="calendar" size={16} color={colorScheme === 'dark' ? '#fff' : '#666'} />
            <Text style={[styles.infoText, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
              {new Date(order.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <FontAwesome name="clock-o" size={16} color={colorScheme === 'dark' ? '#fff' : '#666'} />
            <Text style={[styles.infoText, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
              {order.pickup_time
                ? `Pickup at ${new Date(order.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Pickup in 15-20 min'}
            </Text>
          </View>
          {order.notes ? (
            <View style={styles.infoRow}>
              <FontAwesome name="sticky-note-o" size={16} color={colorScheme === 'dark' ? '#fff' : '#666'} />
              <Text style={[styles.infoText, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
                {order.notes}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.section, styles.itemsSection]}>
          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            Order Items
          </Text>
          {order.order_items.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
                  {item.menu_items?.name ?? 'Item'}
                </Text>
                <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
              </View>
              <Text style={[styles.itemPrice, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
                ${(Number(item.unit_price) * Number(item.quantity)).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={[styles.summaryValue, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
              ${Number(order.subtotal).toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tip</Text>
            <Text style={[styles.summaryValue, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
              ${Number(order.tip).toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalSection}>
            <Text style={[styles.totalLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
              Total Amount
            </Text>
            <Text style={[styles.totalAmount, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
              ${Number(order.total).toFixed(2)}
            </Text>
          </View>
        </View>

        {order.status === 'ready' && (
          <TouchableOpacity
            style={styles.pickupButton}
            onPress={() => {
              // Handle pickup confirmation
              alert('Please show this screen to the cafe staff when picking up your order.');
            }}
          >
            <FontAwesome name="check-circle" size={20} color="#fff" style={styles.pickupButtonIcon} />
            <Text style={styles.pickupButtonText}>Show to Staff for Pickup</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  cafeImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  cafeImagePlaceholder: {
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cafeName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  itemsSection: {
    backgroundColor: 'transparent',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  pickupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  pickupButtonIcon: {
    marginRight: 8,
  },
  pickupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
