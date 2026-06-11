import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { colors, fonts, glassCard, display, overline, primaryButton, primaryButtonText } from '../../lib/theme';
import GradientScreen from '../../components/GradientScreen';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  customizations?: {
    name: string;
    option: string;
  }[];
  price: number;
}

interface Order {
  id: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  timeElapsed: string;
  note?: string;
}

const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    customerName: 'John Smith',
    items: [
      {
        id: '1',
        name: 'Cappuccino',
        quantity: 2,
        customizations: [
          { name: 'Size', option: 'Large' },
          { name: 'Milk', option: 'Oat Milk' }
        ],
        price: 5.00
      },
      {
        id: '2',
        name: 'Croissant',
        quantity: 1,
        price: 3.50
      }
    ],
    total: 13.50,
    status: 'new',
    timeElapsed: '2m',
    note: 'Extra hot please'
  },
  {
    id: '2',
    customerName: 'Emma Wilson',
    items: [
      {
        id: '3',
        name: 'Iced Latte',
        quantity: 1,
        customizations: [
          { name: 'Size', option: 'Regular' },
          { name: 'Milk', option: 'Almond Milk' }
        ],
        price: 4.50
      }
    ],
    total: 4.50,
    status: 'preparing',
    timeElapsed: '8m'
  },
  {
    id: '3',
    customerName: 'Michael Brown',
    items: [
      {
        id: '4',
        name: 'Espresso',
        quantity: 2,
        price: 3.00
      },
      {
        id: '5',
        name: 'Blueberry Muffin',
        quantity: 1,
        price: 3.50
      }
    ],
    total: 9.50,
    status: 'ready',
    timeElapsed: '15m'
  }
];

const FILTER_STATUSES = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'ready', label: 'Ready' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const STATUS_LABELS: Record<Order['status'], string> = {
  new: 'New',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === '' ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    const orderExists = orders.some(order => order.id === orderId);
    if (!orderExists) {
      Alert.alert('Error', 'Order not found');
      return;
    }

    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId
          ? { ...order, status: newStatus }
          : order
      )
    );
    Alert.alert('Success', `Order #${orderId} status updated to ${newStatus}`);
  };

  const getNextStatus = (currentStatus: Order['status']): Order['status'] | null => {
    switch (currentStatus) {
      case 'new': return 'preparing';
      case 'preparing': return 'ready';
      case 'ready': return 'completed';
      default: return null;
    }
  };

  // Daybreak status language: new = dawn, in progress = sage outline,
  // ready = solid sage, completed/cancelled = muted ink. No other hues.
  const statusPillStyle = (status: Order['status']) => {
    switch (status) {
      case 'new': return styles.pillNew;
      case 'preparing': return styles.pillPreparing;
      case 'ready': return styles.pillReady;
      default: return styles.pillDone;
    }
  };

  const statusPillTextStyle = (status: Order['status']) => {
    switch (status) {
      case 'new': return styles.pillTextNew;
      case 'preparing': return styles.pillTextPreparing;
      case 'ready': return styles.pillTextReady;
      default: return styles.pillTextDone;
    }
  };

  const renderFilterStatus = ({ item }: { item: typeof FILTER_STATUSES[0] }) => {
    const isOn = selectedStatus === item.id;
    return (
      <TouchableOpacity
        style={[styles.filterChip, isOn && styles.filterChipOn]}
        onPress={() => setSelectedStatus(item.id)}
      >
        <Text style={[styles.filterChipText, isOn && styles.filterChipTextOn]}>
          {item.label}{' '}
          <Text
            style={[
              styles.filterChipCount,
              !isOn && item.id === 'new' && styles.filterChipCountDawn,
              isOn && styles.filterChipCountOn,
            ]}
          >
            {isOn
              ? filteredOrders.length
              : orders.filter(order => order.status === item.id).length}
          </Text>
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <GradientScreen>
      <View style={styles.container}>
        <View style={styles.searchField}>
          <Feather name="search" size={15} color={colors.inkMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            placeholderTextColor={colors.inkMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          data={FILTER_STATUSES}
          renderItem={renderFilterStatus}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterList}
          contentContainerStyle={styles.filterListContent}
        />

        <ScrollView
          style={styles.ordersList}
          contentContainerStyle={styles.ordersListContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredOrders.map(order => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.orderWho}>
                  <Text style={styles.orderNumber}>№ {order.id}</Text>
                  <Text style={styles.customerName}>{order.customerName}</Text>
                </View>
                <View style={[styles.pill, statusPillStyle(order.status)]}>
                  {order.status === 'new' && <View style={styles.pillDot} />}
                  <Text style={[styles.pillText, statusPillTextStyle(order.status)]}>
                    {STATUS_LABELS[order.status]}
                  </Text>
                </View>
                <View style={styles.orderTime}>
                  <Feather name="clock" size={11} color={colors.inkMuted} />
                  <Text style={styles.timeText}>{order.timeElapsed} ago</Text>
                </View>
              </View>

              <View style={styles.itemsList}>
                {order.items.map(item => (
                  <View key={item.id} style={styles.orderItem}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemName}>
                        <Text style={styles.itemQty}>{item.quantity}× </Text>
                        {item.name}
                      </Text>
                      <Text style={styles.itemPrice}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </Text>
                    </View>
                    {item.customizations?.map((custom, index) => (
                      <Text key={index} style={styles.customization}>
                        {custom.name}: {custom.option}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>

              {order.note && (
                <View style={styles.noteRow}>
                  <Feather name="edit-3" size={12} color={colors.inkMuted} />
                  <Text style={styles.noteText}>“{order.note}”</Text>
                </View>
              )}

              <View style={styles.orderFooter}>
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalAmount}>${order.total.toFixed(2)}</Text>
                </View>

                {order.status !== 'completed' && order.status !== 'cancelled' && (
                  <TouchableOpacity
                    style={styles.ghostBtn}
                    onPress={() => updateOrderStatus(order.id, 'cancelled')}
                  >
                    <Text style={styles.ghostBtnText}>Cancel</Text>
                  </TouchableOpacity>
                )}

                {order.status !== 'completed' && order.status !== 'cancelled' && (
                  <TouchableOpacity
                    style={styles.advanceBtn}
                    onPress={() => {
                      const nextStatus = getNextStatus(order.status);
                      if (nextStatus) {
                        updateOrderStatus(order.id, nextStatus);
                      }
                    }}
                  >
                    <Text style={styles.advanceBtnText}>
                      {order.status === 'new' ? 'Start Preparing' :
                       order.status === 'preparing' ? 'Mark Ready' :
                       order.status === 'ready' ? 'Complete Order' : ''}
                    </Text>
                    <Feather name="chevron-right" size={12} color={colors.white} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glassSoft,
    borderWidth: 1,
    borderColor: 'rgba(79,130,104,0.25)',
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.light,
    fontSize: 13.5,
    color: colors.ink,
    paddingVertical: 12,
    marginLeft: 10,
  },
  filterList: {
    flexGrow: 0,
    marginBottom: 13,
  },
  filterListContent: {
    paddingRight: 16,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(79,130,104,0.32)',
    backgroundColor: 'rgba(255,255,255,0.45)',
    marginRight: 8,
  },
  filterChipOn: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  filterChipText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: colors.inkSoft,
  },
  filterChipTextOn: {
    color: colors.white,
    fontFamily: fonts.semibold,
  },
  filterChipCount: {
    fontFamily: fonts.semibold,
    color: colors.inkMuted,
  },
  filterChipCountDawn: {
    color: colors.dawnInk,
  },
  filterChipCountOn: {
    color: colors.white,
  },
  ordersList: {
    flex: 1,
  },
  ordersListContent: {
    paddingBottom: 24,
  },
  orderCard: {
    ...glassCard,
    borderRadius: 12,
    padding: 15,
    marginBottom: 11,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  orderWho: {
    flex: 1,
    marginRight: 8,
  },
  orderNumber: {
    ...display(16),
  },
  customerName: {
    fontFamily: fonts.light,
    fontSize: 11.5,
    letterSpacing: 0.4,
    color: colors.inkSoft,
    marginTop: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginRight: 8,
  },
  pillDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.gold,
    marginRight: 5,
  },
  pillNew: {
    backgroundColor: 'rgba(229,169,79,0.14)',
    borderColor: 'rgba(229,169,79,0.5)',
  },
  pillPreparing: {
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderColor: 'rgba(79,130,104,0.5)',
  },
  pillReady: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  pillDone: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderColor: 'rgba(35,43,58,0.18)',
  },
  pillText: {
    fontFamily: fonts.semibold,
    fontSize: 9.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  pillTextNew: {
    color: colors.dawnInk,
  },
  pillTextPreparing: {
    color: colors.sage,
  },
  pillTextReady: {
    color: colors.white,
  },
  pillTextDone: {
    color: colors.inkMuted,
  },
  orderTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timeText: {
    fontFamily: fonts.light,
    fontSize: 10.5,
    color: colors.inkMuted,
    marginLeft: 4,
  },
  itemsList: {
    marginTop: 9,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineFaint,
  },
  orderItem: {
    marginBottom: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 2,
  },
  itemName: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    letterSpacing: 0.2,
    color: colors.ink,
    marginRight: 12,
  },
  itemQty: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.sage,
  },
  itemPrice: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.ink,
  },
  customization: {
    fontFamily: fonts.light,
    fontSize: 11,
    letterSpacing: 0.3,
    color: colors.inkMuted,
    paddingLeft: 21,
    paddingBottom: 3,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },
  noteText: {
    flex: 1,
    fontFamily: fonts.light,
    fontSize: 11.5,
    letterSpacing: 0.3,
    color: colors.inkSoft,
    marginLeft: 7,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineFaint,
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    ...overline(9.5),
    letterSpacing: 1.4,
    color: colors.inkMuted,
    marginBottom: 1,
  },
  totalAmount: {
    ...display(15),
  },
  ghostBtn: {
    borderWidth: 1,
    borderColor: 'rgba(35,43,58,0.2)',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  ghostBtnText: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.inkSoft,
  },
  advanceBtn: {
    ...primaryButton,
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  advanceBtnText: {
    ...primaryButtonText,
    fontSize: 10.5,
    letterSpacing: 1.3,
    marginRight: 5,
  },
});
