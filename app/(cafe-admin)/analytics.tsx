import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { colors, fonts, glassCard, display, overline } from '../../lib/theme';
import GradientScreen from '../../components/GradientScreen';

interface SalesData {
  date: string;
  amount: number;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  averageVisits: number;
  retentionRate: number;
}

interface PeakHour {
  hour: string;
  orders: number;
}

const MOCK_DATA = {
  overview: {
    totalSales: 12500,
    totalOrders: 450,
    averageOrderValue: 27.78,
    newCustomers: 85
  },
  revenueData: {
    daily: [
      { date: 'Mon', amount: 1200 },
      { date: 'Tue', amount: 1500 },
      { date: 'Wed', amount: 1800 },
      { date: 'Thu', amount: 1600 },
      { date: 'Fri', amount: 2200 },
      { date: 'Sat', amount: 2800 },
      { date: 'Sun', amount: 1600 }
    ],
    weekly: [
      { date: 'Week 1', amount: 8500 },
      { date: 'Week 2', amount: 9200 },
      { date: 'Week 3', amount: 8800 },
      { date: 'Week 4', amount: 12500 }
    ],
    monthly: [
      { date: 'Jan', amount: 32000 },
      { date: 'Feb', amount: 35000 },
      { date: 'Mar', amount: 38000 },
      { date: 'Apr', amount: 42000 },
      { date: 'May', amount: 45000 },
      { date: 'Jun', amount: 48000 }
    ]
  },
  topProducts: [
    { name: 'Cappuccino', quantity: 450, revenue: 2025 },
    { name: 'Latte', quantity: 380, revenue: 1900 },
    { name: 'Croissant', quantity: 320, revenue: 1120 },
    { name: 'Green Tea', quantity: 280, revenue: 840 },
    { name: 'Chocolate Cake', quantity: 250, revenue: 1250 }
  ],
  customerMetrics: {
    totalCustomers: 1200,
    newCustomers: 85,
    averageVisits: 3.2,
    retentionRate: 75
  },
  peakHours: [
    { hour: '8:00', orders: 45 },
    { hour: '9:00', orders: 65 },
    { hour: '10:00', orders: 85 },
    { hour: '11:00', orders: 95 },
    { hour: '12:00', orders: 120 },
    { hour: '13:00', orders: 110 },
    { hour: '14:00', orders: 90 },
    { hour: '15:00', orders: 75 }
  ]
};

type TimeRange = 'daily' | 'weekly' | 'monthly';

const TIME_RANGES: TimeRange[] = ['daily', 'weekly', 'monthly'];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');

  const getMaxSales = (data: SalesData[]) => {
    if (!data || data.length === 0) return 0;
    return Math.max(...data.map(item => item.amount));
  };

  const renderSalesChart = () => {
    const data = MOCK_DATA.revenueData[timeRange];
    const maxSales = getMaxSales(data);
    const chartHeight = 170;

    return (
      <View style={styles.chartContainer}>
        {data.map((item, index) => {
          const barHeight = (item.amount / maxSales) * chartHeight;
          return (
            <View key={index} style={styles.barContainer}>
              <View style={[styles.bar, { height: barHeight }]} />
              <Text style={styles.barLabel}>{item.date}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <GradientScreen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Overview Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Sales</Text>
            <View style={styles.statValueRow}>
              <Feather name="dollar-sign" size={15} color={colors.sage} />
              <Text style={styles.statValue}>
                ${MOCK_DATA.overview.totalSales.toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Orders</Text>
            <View style={styles.statValueRow}>
              <Feather name="shopping-cart" size={15} color={colors.sage} />
              <Text style={styles.statValue}>{MOCK_DATA.overview.totalOrders}</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Avg. Order Value</Text>
            <View style={styles.statValueRow}>
              <Feather name="trending-up" size={15} color={colors.sage} />
              <Text style={styles.statValue}>
                ${MOCK_DATA.overview.averageOrderValue.toFixed(2)}
              </Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>New Customers</Text>
            <View style={styles.statValueRow}>
              <Feather name="users" size={15} color={colors.sage} />
              <Text style={styles.statValue}>{MOCK_DATA.overview.newCustomers}</Text>
            </View>
          </View>
        </View>

        {/* Revenue Chart */}
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardHeading}>Revenue</Text>
            <View style={styles.chipRow}>
              {TIME_RANGES.map((range) => (
                <TouchableOpacity
                  key={range}
                  style={[styles.chip, timeRange === range && styles.chipOn]}
                  onPress={() => setTimeRange(range)}
                >
                  <Text style={[styles.chipText, timeRange === range && styles.chipTextOn]}>
                    {range}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {renderSalesChart()}
        </View>

        {/* Top Products */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Top Products</Text>
          {MOCK_DATA.topProducts.map((product, index) => (
            <View
              key={index}
              style={[
                styles.productRow,
                index < MOCK_DATA.topProducts.length - 1 && styles.rowDivider,
              ]}
            >
              <View style={styles.productInfo}>
                <Text style={styles.productName}>
                  <Text style={styles.productRank}>{index + 1} · </Text>
                  {product.name}
                </Text>
                <Text style={styles.productQuantity}>
                  {product.quantity} units sold
                </Text>
              </View>
              <Text style={styles.productRevenue}>
                ${product.revenue.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* Customer Insights */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Customer Insights</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {MOCK_DATA.customerMetrics.totalCustomers.toLocaleString()}
              </Text>
              <Text style={styles.metricLabel}>Total Customers</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {MOCK_DATA.customerMetrics.newCustomers}
              </Text>
              <Text style={styles.metricLabel}>New Customers</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {MOCK_DATA.customerMetrics.averageVisits}
              </Text>
              <Text style={styles.metricLabel}>Avg. Visits/Month</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {MOCK_DATA.customerMetrics.retentionRate}%
              </Text>
              <Text style={styles.metricLabel}>Retention Rate</Text>
            </View>
          </View>
        </View>

        {/* Peak Hours */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Peak Hours</Text>
          <View style={styles.peakHoursContainer}>
            {MOCK_DATA.peakHours.map((hour, index) => {
              const maxOrders = Math.max(...MOCK_DATA.peakHours.map(h => h.orders));
              const barHeight = (hour.orders / maxOrders) * 100;
              return (
                <View key={index} style={styles.peakHourBar}>
                  <View
                    style={[
                      styles.peakHourBarFill,
                      { height: `${barHeight}%` }
                    ]}
                  />
                  <Text style={styles.peakHourLabel}>{hour.hour}</Text>
                  <Text style={styles.peakHourValue}>{hour.orders}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </GradientScreen>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 54) / 2;

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 28,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 13,
  },
  statCard: {
    ...glassCard,
    borderRadius: 12,
    width: cardWidth,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  statLabel: {
    ...overline(9.5),
    color: colors.inkMuted,
    letterSpacing: 1.6,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },
  statValue: {
    ...display(21),
    marginLeft: 7,
  },
  card: {
    ...glassCard,
    borderRadius: 12,
    padding: 17,
    marginBottom: 13,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardHeading: {
    fontFamily: fonts.display,
    fontSize: 14,
    letterSpacing: 2.8,
    textTransform: 'uppercase',
    color: colors.sage,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(79,130,104,0.32)',
    backgroundColor: 'rgba(255,255,255,0.45)',
    marginLeft: 6,
  },
  chipOn: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.inkSoft,
  },
  chipTextOn: {
    color: colors.white,
    fontFamily: fonts.semibold,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 200,
    paddingTop: 16,
    paddingBottom: 4,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    backgroundColor: colors.sage,
  },
  barLabel: {
    fontFamily: fonts.light,
    fontSize: 10.5,
    letterSpacing: 0.3,
    color: colors.inkSoft,
    marginTop: 8,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineFaint,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontFamily: fonts.regular,
    fontSize: 14,
    letterSpacing: 0.3,
    color: colors.ink,
  },
  productRank: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.sage,
  },
  productQuantity: {
    fontFamily: fonts.light,
    fontSize: 11.5,
    letterSpacing: 0.3,
    color: colors.inkSoft,
    marginTop: 2,
  },
  productRevenue: {
    ...display(15),
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  metricItem: {
    width: '50%',
    paddingVertical: 9,
  },
  metricValue: {
    ...display(20),
  },
  metricLabel: {
    ...overline(9),
    color: colors.inkMuted,
    letterSpacing: 1.4,
    marginTop: 4,
  },
  peakHoursContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: 16,
  },
  peakHourBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  peakHourBarFill: {
    width: '100%',
    backgroundColor: colors.sage,
    borderRadius: 4,
  },
  peakHourLabel: {
    fontFamily: fonts.light,
    fontSize: 9.5,
    letterSpacing: 0.2,
    color: colors.inkSoft,
    marginTop: 7,
  },
  peakHourValue: {
    fontFamily: fonts.light,
    fontSize: 9.5,
    color: colors.inkMuted,
    marginTop: 2,
  },
});
