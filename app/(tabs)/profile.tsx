import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useState } from 'react';

import { supabase } from '../../lib/supabase';
import { colors, fonts, radius, glassCard, display, overline, primaryButton, primaryButtonText } from '../../lib/theme';
import GradientScreen from '../../components/GradientScreen';

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  badge?: string | number;
}

interface FavoriteCafe {
  id: number;
  name: string;
  image: string | null;
  rating: number;
  address: string;
}

interface RecentOrder {
  id: number;
  cafeName: string;
  date: string;
  total: number;
  status: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isSignedIn, setIsSignedIn] = useState(true);
  const [fullName, setFullName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<FavoriteCafe[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (isActive) setIsSignedIn(false);
          return;
        }
        if (isActive) {
          setIsSignedIn(true);
          setEmail(user.email ?? null);
        }

        const [profileRes, favoritesRes, ordersRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', user.id)
            .maybeSingle(),
          supabase
            .from('favorites')
            .select('cafe_id, cafes(name, address, avg_rating, profile_image_url)')
            .eq('user_id', user.id),
          supabase
            .from('orders')
            .select('order_id, status, total, created_at, cafes(name)')
            .order('created_at', { ascending: false })
            .limit(5),
        ]);

        if (!isActive) return;

        if (profileRes.error) {
          console.error('Error fetching profile:', profileRes.error);
        } else if (profileRes.data) {
          setFullName(profileRes.data.full_name ?? null);
          setAvatarUrl(profileRes.data.avatar_url ?? null);
        }

        if (favoritesRes.error) {
          console.error('Error fetching favorites:', favoritesRes.error);
        } else {
          setFavorites(
            (favoritesRes.data ?? []).flatMap((row: any): FavoriteCafe[] => {
              const cafe = Array.isArray(row.cafes) ? row.cafes[0] : row.cafes;
              if (!cafe) return [];
              return [{
                id: row.cafe_id,
                name: cafe.name,
                image: cafe.profile_image_url,
                rating: Number(cafe.avg_rating || 0),
                address: cafe.address,
              }];
            })
          );
        }

        if (ordersRes.error) {
          console.error('Error fetching orders:', ordersRes.error);
        } else {
          setRecentOrders(
            (ordersRes.data ?? []).map((row: any): RecentOrder => {
              const cafe = Array.isArray(row.cafes) ? row.cafes[0] : row.cafes;
              return {
                id: row.order_id,
                cafeName: cafe?.name ?? 'Unknown cafe',
                date: row.created_at,
                total: Number(row.total || 0),
                status: row.status ?? '',
              };
            })
          );
        }
      };

      loadProfile();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
              Alert.alert('Error', 'Could not sign out. Please try again.');
            }
            // The root layout's auth listener handles redirecting to sign-in.
          }
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'preparing':
        return colors.inkSoft;
      case 'ready':
        return colors.sage;
      case 'completed':
        return colors.inkMuted;
      case 'cancelled':
        return colors.inkMuted;
      default:
        return colors.inkMuted;
    }
  };

  const menuItems: MenuItem[] = [
    {
      id: '1',
      title: 'Personal Information',
      icon: 'user',
      onPress: () => Alert.alert('Coming Soon', 'Edit profile feature will be available soon!'),
    },
    {
      id: '2',
      title: 'Payment Methods',
      icon: 'credit-card',
      onPress: () => Alert.alert('Coming Soon', 'Payment methods feature will be available soon!'),
      badge: '2',
    },
    {
      id: '3',
      title: 'Notifications',
      icon: 'bell',
      onPress: () => Alert.alert('Coming Soon', 'Notifications feature will be available soon!'),
      badge: '5',
    },
    {
      id: '4',
      title: 'Help & Support',
      icon: 'help-circle',
      onPress: () => Alert.alert('Coming Soon', 'Help & Support feature will be available soon!'),
    },
    {
      id: '5',
      title: 'Terms & Conditions',
      icon: 'file-text',
      onPress: () => Alert.alert('Coming Soon', 'Terms & Conditions will be available soon!'),
    },
    {
      id: '6',
      title: 'Privacy Policy',
      icon: 'shield',
      onPress: () => Alert.alert('Coming Soon', 'Privacy Policy will be available soon!'),
    },
  ];

  const renderMenuItem = (item: MenuItem, index: number) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.menuItem, index > 0 && styles.rowDivider]}
      onPress={item.onPress}
    >
      <View style={styles.menuItemLeft}>
        <Feather name={item.icon} size={17} color={colors.sage} style={styles.menuIcon} />
        <Text style={styles.menuTitle}>{item.title}</Text>
      </View>
      <View style={styles.menuItemRight}>
        {item.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
        <Feather name="chevron-right" size={16} color={colors.inkMuted} />
      </View>
    </TouchableOpacity>
  );

  if (!isSignedIn) {
    return (
      <GradientScreen>
        <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
          <View style={styles.greet}>
            <Text style={styles.greetKicker}>Your account</Text>
            <Text style={styles.greetTitle}>Profile</Text>
          </View>
          <View style={styles.signInContainer}>
            <Feather name="coffee" size={44} color={colors.inkMuted} />
            <Text style={styles.signInTitle}>Welcome to Cafe</Text>
            <Text style={styles.signInSubtitle}>
              Sign in to access your profile, orders, and favorites
            </Text>
            <TouchableOpacity
              style={[primaryButton, styles.signInButton]}
              onPress={() => router.push('/(auth)/sign-in')}
            >
              <Text style={primaryButtonText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.signUpButton}
              onPress={() => router.push('/(auth)/sign-up')}
            >
              <Text style={styles.signUpButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </GradientScreen>
    );
  }

  return (
    <GradientScreen>
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <View style={styles.greet}>
          <Text style={styles.greetKicker}>Your account</Text>
          <Text style={styles.greetTitle}>Profile</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <View style={styles.identityRow}>
              <Image
                source={{ uri: avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500' }}
                style={styles.profileImage}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.name}>{fullName || email || ''}</Text>
                <Text style={styles.email}>{email || ''}</Text>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => Alert.alert('Coming Soon', 'Edit profile feature will be available soon!')}
                >
                  <Feather name="edit-2" size={13} color={colors.sage} />
                  <Text style={styles.editButtonText}>Edit Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={[styles.card, styles.statsRow]}>
            <TouchableOpacity style={styles.statItem} onPress={() => router.push('/orders')}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem}>
              <View style={styles.ratingContainer}>
                <Text style={styles.statNumber}>4.8</Text>
                <FontAwesome name="star" size={14} color={colors.gold} style={styles.ratingStar} />
              </View>
              <Text style={styles.statLabel}>Rating</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>$156</Text>
              <Text style={styles.statLabel}>Spent</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Favorite Cafes</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>
          {favorites.length === 0 ? (
            <Text style={styles.emptyText}>No favorites yet</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.favoritesScroll}
              contentContainerStyle={styles.favoritesScrollContent}
            >
              {favorites.map(cafe => (
                <TouchableOpacity
                  key={cafe.id}
                  style={styles.favoriteCard}
                  onPress={() => router.push(`/cafe/${cafe.id}`)}
                >
                  {cafe.image ? (
                    <Image source={{ uri: cafe.image }} style={styles.favoriteImage} />
                  ) : (
                    <View style={[styles.favoriteImage, styles.favoriteImagePlaceholder]}>
                      <Feather name="coffee" size={32} color={colors.inkMuted} />
                    </View>
                  )}
                  <View style={styles.favoriteInfo}>
                    <Text style={styles.favoriteName}>{cafe.name}</Text>
                    <View style={styles.favoriteStats}>
                      <View style={styles.favoriteRating}>
                        <FontAwesome name="star" size={12} color={colors.gold} />
                        <Text style={styles.favoriteRatingText}>{cafe.rating}</Text>
                      </View>
                      <Text style={styles.favoriteAddress} numberOfLines={1}>
                        {cafe.address}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => router.push('/orders')}>
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentOrders.length === 0 ? (
            <Text style={styles.emptyText}>No orders yet</Text>
          ) : (
            <View style={styles.card}>
              {recentOrders.map((order, index) => (
                <TouchableOpacity
                  key={order.id}
                  style={[styles.orderRow, index > 0 && styles.rowDivider]}
                  onPress={() => router.push(`/order/${order.id}`)}
                >
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderCafeName}>{order.cafeName}</Text>
                    <Text style={styles.orderDate}>
                      {new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={styles.orderDetails}>
                    <Text style={styles.orderTotal}>${order.total.toFixed(2)}</Text>
                    <Text style={[styles.orderStatus, { color: getStatusColor(order.status) }]}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardHeading}>Settings</Text>
            {menuItems.map((item, index) => renderMenuItem(item, index))}
          </View>

          <View style={styles.card}>
            <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
              <View style={styles.menuItemLeft}>
                <Feather name="log-out" size={17} color={colors.inkSoft} style={styles.menuIcon} />
                <Text style={styles.signOutTitle}>Sign Out</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.inkMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, styles.rowDivider]}
              onPress={() => router.push('/(cafe-admin)/login')}
            >
              <View style={styles.menuItemLeft}>
                <Feather name="coffee" size={17} color={colors.sage} style={styles.menuIcon} />
                <Text style={styles.menuTitle}>Cafe Admin Portal</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.inkMuted} />
            </TouchableOpacity>
          </View>
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
  greet: {
    marginTop: 8,
    marginBottom: 18,
  },
  greetKicker: {
    ...overline(11),
    letterSpacing: 3,
  },
  greetTitle: {
    ...display(28),
    marginTop: 8,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  card: {
    ...glassCard,
    borderRadius: 12,
    padding: 17,
    marginBottom: 13,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 76,
    height: 76,
    borderRadius: radius.round,
    borderWidth: 2,
    borderColor: colors.glassBorder,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 15,
  },
  name: {
    ...display(20),
  },
  email: {
    fontFamily: fonts.light,
    fontSize: 13,
    letterSpacing: 0.3,
    color: colors.inkSoft,
    marginTop: 3,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.sageBorder,
    backgroundColor: colors.glassSoft,
    borderRadius: radius.chip,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  editButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 10.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.sage,
    marginLeft: 7,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: colors.hairlineFaint,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStar: {
    marginLeft: 5,
  },
  statNumber: {
    ...display(21),
  },
  statLabel: {
    ...overline(10),
    color: colors.inkMuted,
    marginTop: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 14,
    letterSpacing: 2.8,
    textTransform: 'uppercase',
    color: colors.sage,
  },
  seeAllButton: {
    ...overline(12),
    letterSpacing: 1.7,
  },
  favoritesScroll: {
    marginHorizontal: -22,
  },
  favoritesScrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 18,
  },
  favoriteCard: {
    ...glassCard,
    width: 200,
    marginRight: 12,
  },
  favoriteImage: {
    width: '100%',
    height: 110,
    borderTopLeftRadius: radius.card - 1,
    borderTopRightRadius: radius.card - 1,
  },
  favoriteImagePlaceholder: {
    backgroundColor: colors.sageTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: fonts.light,
    fontSize: 13.5,
    letterSpacing: 0.3,
    color: colors.inkMuted,
    marginBottom: 13,
  },
  favoriteInfo: {
    padding: 12,
  },
  favoriteName: {
    ...display(15),
  },
  favoriteStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  favoriteRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  favoriteRatingText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.ink,
    marginLeft: 4,
  },
  favoriteAddress: {
    flex: 1,
    fontFamily: fonts.light,
    fontSize: 12,
    color: colors.inkSoft,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.hairlineFaint,
  },
  orderInfo: {
    flex: 1,
    marginRight: 12,
  },
  orderCafeName: {
    fontFamily: fonts.medium,
    fontSize: 14.5,
    letterSpacing: 0.5,
    color: colors.ink,
  },
  orderDate: {
    fontFamily: fonts.light,
    fontSize: 12,
    letterSpacing: 0.2,
    color: colors.inkSoft,
    marginTop: 3,
  },
  orderDetails: {
    alignItems: 'flex-end',
  },
  orderTotal: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
  },
  orderStatus: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 0.8,
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  menuItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 22,
    textAlign: 'center',
    marginRight: 13,
  },
  menuTitle: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    letterSpacing: 0.4,
    color: colors.ink,
  },
  signOutTitle: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    letterSpacing: 0.4,
    color: colors.inkSoft,
  },
  badge: {
    backgroundColor: colors.sage,
    borderRadius: radius.round,
    minWidth: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignItems: 'center',
    marginRight: 9,
  },
  badgeText: {
    color: colors.white,
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  signInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  signInTitle: {
    ...display(22),
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  signInSubtitle: {
    fontFamily: fonts.light,
    fontSize: 14,
    letterSpacing: 0.3,
    color: colors.inkSoft,
    textAlign: 'center',
    marginBottom: 24,
  },
  signInButton: {
    width: '100%',
  },
  signUpButton: {
    width: '100%',
    marginTop: 12,
    paddingVertical: 15,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.sageBorder,
    backgroundColor: colors.glassSoft,
    alignItems: 'center',
  },
  signUpButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: colors.sage,
  },
});
