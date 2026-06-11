import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, glassCard, display, overline } from '../../lib/theme';
import GradientScreen from '../../components/GradientScreen';

type FeatherIconName = 'shopping-cart' | 'coffee' | 'star' | 'dollar-sign' | 'circle';

interface DashboardCard {
  title: string;
  value: string | number;
  icon: FeatherIconName;
  onPress: () => void;
}

interface RecentActivity {
  id: string;
  type: 'order' | 'review' | 'menu';
  title: string;
  description: string;
  time: string;
  status?: string;
}

function dateKicker(): string {
  const now = new Date();
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  return `${weekday} · ${monthDay}`;
}

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const dashboardCards: DashboardCard[] = [
    {
      title: 'Today\'s Orders',
      value: '12',
      icon: 'shopping-cart',
      onPress: () => router.push('/orders'),
    },
    {
      title: 'Menu Items',
      value: '24',
      icon: 'coffee',
      onPress: () => router.push('/menu'),
    },
    {
      title: 'New Reviews',
      value: '5',
      icon: 'star',
      onPress: () => router.push('/reviews'),
    },
    {
      title: 'Today\'s Revenue',
      value: '$1,234',
      icon: 'dollar-sign',
      onPress: () => router.push('/analytics'),
    },
  ];

  const recentActivity: RecentActivity[] = [
    {
      id: '1',
      type: 'order',
      title: 'New Order #123',
      description: '2 Espressos, 1 Latte',
      time: '5 min ago',
      status: 'pending',
    },
    {
      id: '2',
      type: 'review',
      title: 'New Review',
      description: 'Great coffee and service!',
      time: '15 min ago',
    },
    {
      id: '3',
      type: 'menu',
      title: 'Menu Update',
      description: 'Added new seasonal drinks',
      time: '1 hour ago',
    },
  ];

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const getActivityIcon = (type: string): FeatherIconName => {
    switch (type) {
      case 'order':
        return 'shopping-cart';
      case 'review':
        return 'star';
      case 'menu':
        return 'coffee';
      default:
        return 'circle';
    }
  };

  return (
    <GradientScreen>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.sage} />
          }
        >
          <View style={styles.greet}>
            <View style={styles.greetText}>
              <Text style={styles.greetDate}>{dateKicker()}</Text>
              <Text style={styles.greetTitle}>Dashboard</Text>
              <Text style={styles.greetSub}>Your bar at a glance.</Text>
            </View>
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => router.push('/settings')}
            >
              <Feather name="settings" size={17} color={colors.ink} />
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsGrid}>
            {dashboardCards.map((card, index) => (
              <TouchableOpacity
                key={index}
                style={styles.statCard}
                onPress={card.onPress}
                activeOpacity={0.7}
              >
                <Text style={styles.statLabel}>{card.title}</Text>
                <View style={styles.statValueRow}>
                  <Feather name={card.icon} size={15} color={colors.sage} />
                  <Text style={styles.statValue}>{card.value}</Text>
                </View>
                <Feather name="chevron-right" size={13} color={colors.inkMuted} style={styles.statGo} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Recent Activity */}
          <Text style={styles.sectTitle}>Recent activity</Text>
          <View style={styles.activityCard}>
            {recentActivity.map((activity, index) => {
              const isNewOrder = activity.type === 'order' && activity.status === 'pending';
              return (
                <TouchableOpacity
                  key={activity.id}
                  style={[
                    styles.activityRow,
                    index < recentActivity.length - 1 && styles.activityRowDivider,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    switch (activity.type) {
                      case 'order':
                        router.push('/orders');
                        break;
                      case 'review':
                        router.push('/reviews');
                        break;
                      case 'menu':
                        router.push('/menu');
                        break;
                    }
                  }}
                >
                  <View style={[styles.activityIcon, isNewOrder && styles.activityIconDawn]}>
                    <Feather
                      name={getActivityIcon(activity.type)}
                      size={15}
                      color={isNewOrder ? colors.dawnInk : colors.sage}
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityDesc} numberOfLines={1}>
                      {activity.description}
                    </Text>
                  </View>
                  <View style={styles.activityMeta}>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                    {activity.status && (
                      <View style={[styles.statusPill, isNewOrder && styles.statusPillDawn]}>
                        <Text style={[styles.statusPillText, isNewOrder && styles.statusPillTextDawn]}>
                          {isNewOrder ? 'New' : activity.status}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </GradientScreen>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 54) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 22,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  greet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 18,
  },
  greetText: {
    flex: 1,
  },
  greetDate: {
    ...overline(11),
    letterSpacing: 3,
  },
  greetTitle: {
    ...display(26),
    marginTop: 8,
  },
  greetSub: {
    fontFamily: fonts.light,
    fontSize: 12.5,
    letterSpacing: 0.3,
    color: colors.inkSoft,
    marginTop: 4,
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.sageBorder,
    backgroundColor: colors.glassSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
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
    ...display(23),
    marginLeft: 7,
  },
  statGo: {
    position: 'absolute',
    top: 13,
    right: 12,
  },
  sectTitle: {
    ...display(16),
    letterSpacing: 1.9,
    marginTop: 20,
    marginBottom: 10,
  },
  activityCard: {
    ...glassCard,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
  },
  activityRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineFaint,
  },
  activityIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.sageBorder,
    backgroundColor: colors.sageTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIconDawn: {
    borderColor: 'rgba(229,169,79,0.5)',
    backgroundColor: 'rgba(229,169,79,0.14)',
  },
  activityContent: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },
  activityTitle: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    letterSpacing: 0.4,
    color: colors.ink,
  },
  activityDesc: {
    fontFamily: fonts.light,
    fontSize: 11,
    letterSpacing: 0.3,
    color: colors.inkSoft,
    marginTop: 2,
  },
  activityMeta: {
    alignItems: 'flex-end',
  },
  activityTime: {
    fontFamily: fonts.light,
    fontSize: 10.5,
    letterSpacing: 0.3,
    color: colors.inkMuted,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.hairlineFaint,
    backgroundColor: colors.glassSoft,
    marginTop: 5,
  },
  statusPillDawn: {
    borderColor: 'rgba(229,169,79,0.5)',
    backgroundColor: 'rgba(229,169,79,0.14)',
  },
  statusPillText: {
    ...overline(9),
    letterSpacing: 1.2,
    color: colors.inkMuted,
  },
  statusPillTextDawn: {
    color: colors.dawnInk,
  },
});
