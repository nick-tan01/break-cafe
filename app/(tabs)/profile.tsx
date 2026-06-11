import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useState } from 'react';

import { supabase } from '../../lib/supabase';

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof FontAwesome.glyphMap;
  onPress: () => void;
  badge?: string | number;
  color?: string;
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
  const colorScheme = useColorScheme();
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
        return '#FFA500';
      case 'ready':
        return '#4CAF50';
      case 'completed':
        return '#666';
      case 'cancelled':
        return '#FF0000';
      default:
        return '#666';
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
      color: '#FF3B30',
    },
    {
      id: '4',
      title: 'Help & Support',
      icon: 'question-circle',
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

  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <TouchableOpacity 
      key={item.id}
      style={[
        styles.menuItem,
        { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }
      ]} 
      onPress={item.onPress}
    >
      <View style={styles.menuItemLeft}>
        <FontAwesome 
          name={item.icon} 
          size={20} 
          color={item.color || '#666'} 
          style={styles.menuIcon} 
        />
        <Text style={[
          styles.menuTitle, 
          { color: colorScheme === 'dark' ? '#fff' : '#000' },
          item.color && { color: item.color }
        ]}>
          {item.title}
        </Text>
      </View>
      <View style={styles.menuItemRight}>
        {item.badge && (
          <View style={[styles.badge, item.color && { backgroundColor: item.color }]}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
        <FontAwesome name="chevron-right" size={16} color="#666" style={styles.chevron} />
      </View>
    </TouchableOpacity>
  );

  if (!isSignedIn) {
    return (
      <View style={[
        styles.container,
        { 
          backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }
      ]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.signInContainer}>
          <Text style={[styles.signInTitle, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            Welcome to Cafe
          </Text>
          <Text style={styles.signInSubtitle}>
            Sign in to access your profile, orders, and favorites
          </Text>
          <TouchableOpacity 
            style={[styles.signInButton, { marginTop: 24 }]}
            onPress={() => router.push('/(auth)/sign-in')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.signUpButton, { marginTop: 12 }]}
            onPress={() => router.push('/(auth)/sign-up')}
          >
            <Text style={styles.signUpButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }
    ]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee' }]}>
          <Image
            source={{ uri: avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500' }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
              {fullName || email || ''}
            </Text>
            <Text style={styles.email}>{email || ''}</Text>
            <TouchableOpacity 
              style={[
                styles.editButton,
                { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f5f5f5' }
              ]}
              onPress={() => Alert.alert('Coming Soon', 'Edit profile feature will be available soon!')}
            >
              <FontAwesome name="pencil" size={14} color="#007AFF" />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.statsContainer, { borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee' }]}>
          <TouchableOpacity style={styles.statItem} onPress={() => router.push('/orders')}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem}>
            <View style={styles.ratingContainer}>
              <Text style={styles.statNumber}>4.8</Text>
              <FontAwesome name="star" size={16} color="#FFD700" style={styles.ratingStar} />
            </View>
            <Text style={styles.statLabel}>Rating</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>$156</Text>
            <Text style={styles.statLabel}>Spent</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee' }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
              Favorite Cafes
            </Text>
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
            >
              {favorites.map(cafe => (
                <TouchableOpacity
                  key={cafe.id}
                  style={[styles.favoriteCard, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }]}
                  onPress={() => router.push(`/cafe/${cafe.id}`)}
                >
                  {cafe.image ? (
                    <Image source={{ uri: cafe.image }} style={styles.favoriteImage} />
                  ) : (
                    <View style={[styles.favoriteImage, styles.favoriteImagePlaceholder]}>
                      <FontAwesome name="coffee" size={32} color="#999" />
                    </View>
                  )}
                  <View style={styles.favoriteInfo}>
                    <Text style={[styles.favoriteName, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
                      {cafe.name}
                    </Text>
                    <View style={styles.favoriteStats}>
                      <View style={styles.favoriteRating}>
                        <FontAwesome name="star" size={12} color="#FFD700" />
                        <Text style={styles.favoriteRatingText}>{cafe.rating}</Text>
                      </View>
                      <Text style={[styles.favoriteDistance, { flex: 1 }]} numberOfLines={1}>
                        {cafe.address}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={[styles.section, { borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee' }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
              Recent Orders
            </Text>
            <TouchableOpacity onPress={() => router.push('/orders')}>
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentOrders.length === 0 ? (
            <Text style={styles.emptyText}>No orders yet</Text>
          ) : (
            recentOrders.map(order => (
              <TouchableOpacity
                key={order.id}
                style={[styles.orderCard, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }]}
                onPress={() => router.push(`/order/${order.id}`)}
              >
                <View style={styles.orderInfo}>
                  <Text style={[styles.orderCafeName, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
                    {order.cafeName}
                  </Text>
                  <Text style={styles.orderDate}>
                    {new Date(order.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.orderDetails}>
                  <Text style={styles.orderTotal}>${order.total.toFixed(2)}</Text>
                  <View style={[styles.orderStatus, { backgroundColor: getStatusColor(order.status) }]}>
                    <Text style={styles.orderStatusText}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item) => renderMenuItem({ item }))}
          
          <TouchableOpacity 
            style={[
              styles.signOutButton,
              { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }
            ]} 
            onPress={handleSignOut}
          >
            <View style={styles.menuItemLeft}>
              <FontAwesome 
                name="sign-out" 
                size={20} 
                color="#FF3B30" 
                style={styles.menuIcon} 
              />
              <Text style={[styles.menuTitle, { color: '#FF3B30' }]}>
                Sign Out
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={16} color="#666" style={styles.chevron} />
          </TouchableOpacity>

          <TouchableOpacity 
            key="admin-portal"
            style={[styles.menuItem, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }]}
            onPress={() => router.push('/(cafe-admin)/login')}
          >
            <View style={styles.menuItemLeft}>
              <FontAwesome name="coffee" size={24} color="#007AFF" style={styles.menuIcon} />
              <Text style={[styles.menuTitle, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>Cafe Admin Portal</Text>
            </View>
            <FontAwesome name="chevron-right" size={16} color="#666" style={styles.chevron} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#007AFF',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#eee',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStar: {
    marginLeft: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllButton: {
    color: '#007AFF',
    fontSize: 14,
  },
  favoritesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  favoriteCard: {
    width: 200,
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteImage: {
    width: '100%',
    height: 120,
  },
  favoriteImagePlaceholder: {
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    paddingVertical: 8,
  },
  favoriteInfo: {
    padding: 12,
  },
  favoriteName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  favoriteStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  favoriteRatingText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  favoriteDistance: {
    fontSize: 12,
    color: '#666',
  },
  orderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderInfo: {
    flex: 1,
  },
  orderCafeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  orderDetails: {
    alignItems: 'flex-end',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  orderStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderStatusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  menuContainer: {
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  menuTitle: {
    fontSize: 16,
  },
  badge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  chevron: {
    marginLeft: 4,
  },
  signInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  signInTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  signInSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  signInButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  signUpButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginTop: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
}); 