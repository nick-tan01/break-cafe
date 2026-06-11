import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../lib/cart';

interface CafeHourRow {
  cafe_id: number;
  day_of_week: number; // 1 = Monday … 7 = Sunday
  opening_time: string; // "HH:MM:SS"
  closing_time: string; // "HH:MM:SS"
  is_closed: boolean;
}

interface MenuItemRow {
  menu_item_id: number;
  cafe_id: number;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  image_url: string | null;
  is_available: boolean;
}

interface ReviewRow {
  review_id: number;
  cafe_id: number;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface CafeRow {
  cafe_id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  avg_rating: number | null;
  profile_image_url: string | null;
  is_active: boolean;
  cafe_hours: CafeHourRow[];
  menu_items: MenuItemRow[];
  reviews: ReviewRow[];
}

const OTHER_CATEGORY = 'Other';

export default function CafeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { id } = useLocalSearchParams();
  const cafeId = Number(Array.isArray(id) ? id[0] : id);

  const cart = useCart();

  const [cafe, setCafe] = useState<CafeRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showReviews, setShowReviews] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!Number.isFinite(cafeId)) {
        if (isMounted) setIsLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('cafes')
        .select('*, cafe_hours(*), menu_items(*), reviews(*)')
        .eq('cafe_id', cafeId)
        .single();

      if (!isMounted) return;
      if (error) {
        console.error('Error fetching cafe:', error);
        setCafe(null);
      } else {
        setCafe(data as CafeRow);
      }
      setIsLoading(false);
    })();
    return () => {
      isMounted = false;
    };
  }, [cafeId]);

  // Open/closed from cafe_hours (1 = Monday … 7 = Sunday)
  const dayOfWeek = new Date().getDay() === 0 ? 7 : new Date().getDay();
  const currentTime = new Date().toTimeString().slice(0, 5);
  const todayHours = cafe?.cafe_hours?.find((h) => h.day_of_week === dayOfWeek);
  let isOpen = false;
  if (todayHours && !todayHours.is_closed) {
    isOpen =
      currentTime >= todayHours.opening_time.slice(0, 5) &&
      currentTime <= todayHours.closing_time.slice(0, 5);
  }

  const rating = Number(cafe?.avg_rating || 0);
  const reviews = [...(cafe?.reviews ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Available menu items grouped by category (nulls under "Other")
  const availableItems = (cafe?.menu_items ?? []).filter((item) => item.is_available);
  const categories = Array.from(
    new Set(availableItems.map((item) => item.category ?? OTHER_CATEGORY))
  ).sort((a, b) => {
    if (a === OTHER_CATEGORY) return 1;
    if (b === OTHER_CATEGORY) return -1;
    return a.localeCompare(b);
  });
  const visibleCategories = selectedCategory ? [selectedCategory] : categories;
  const itemsForCategory = (category: string) =>
    availableItems.filter((item) => (item.category ?? OTHER_CATEGORY) === category);

  // Cart belongs to a single cafe; only reflect it here when it is this cafe's cart.
  const isThisCafesCart = cart.cafeId === cafe?.cafe_id;
  const quantityInCart = (menuItemId: number) =>
    isThisCafesCart
      ? cart.items.find((i) => i.menuItemId === menuItemId)?.quantity ?? 0
      : 0;

  const addToCart = (item: MenuItemRow) => {
    if (!cafe) return;
    cart.addItem(cafe.cafe_id, cafe.name, {
      menuItemId: item.menu_item_id,
      name: item.name,
      price: item.price,
    });
  };

  const decrementItem = (item: MenuItemRow) => {
    cart.setQuantity(item.menu_item_id, quantityInCart(item.menu_item_id) - 1);
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  // Create dynamic styles based on color scheme
  const dynamicStyles = StyleSheet.create({
    reviewsSection: {
      padding: 16,
      backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff',
      borderTopWidth: 1,
      borderTopColor: '#eee',
    },
    reviewsTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colorScheme === 'dark' ? '#fff' : '#000',
    },
    overallRating: {
      alignItems: 'center',
      marginBottom: 24,
      padding: 16,
      backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#f8f8f8',
      borderRadius: 12,
    },
    ratingNumber: {
      fontSize: 48,
      fontWeight: 'bold',
      color: colorScheme === 'dark' ? '#fff' : '#000',
      marginBottom: 8,
    },
    review: {
      marginBottom: 24,
      padding: 16,
      backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#f8f8f8',
      borderRadius: 12,
    },
    reviewerName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colorScheme === 'dark' ? '#fff' : '#000',
      marginBottom: 4,
    },
    reviewComment: {
      fontSize: 14,
      color: colorScheme === 'dark' ? '#fff' : '#000',
      lineHeight: 20,
      marginBottom: 12,
    },
  });

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: '',
            headerStyle: { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' },
            headerTintColor: colorScheme === 'dark' ? '#fff' : '#000',
            headerShadowVisible: false,
          }}
        />
        <View
          style={[
            styles.container,
            styles.centerContainer,
            { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' },
          ]}
        >
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </>
    );
  }

  if (!cafe) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Cafe',
            headerStyle: { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' },
            headerTintColor: colorScheme === 'dark' ? '#fff' : '#000',
            headerShadowVisible: false,
          }}
        />
        <View
          style={[
            styles.container,
            styles.centerContainer,
            { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' },
          ]}
        >
          <FontAwesome name="coffee" size={48} color="#666" />
          <Text style={[styles.notFoundText, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            Cafe not found
          </Text>
          <TouchableOpacity style={styles.notFoundButton} onPress={() => router.back()}>
            <Text style={styles.notFoundButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: cafe.name,
          headerStyle: {
            backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
          },
          headerTintColor: colorScheme === 'dark' ? '#fff' : '#000',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          headerLeft: () => (
            <TouchableOpacity
              style={{
                marginLeft: 16,
                padding: 8,
                borderRadius: 20,
              }}
              onPress={() => router.back()}
            >
              <FontAwesome
                name="chevron-left"
                size={20}
                color={colorScheme === 'dark' ? '#fff' : '#000'}
              />
            </TouchableOpacity>
          ),
          headerShadowVisible: false,
        }}
      />
      <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }]}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.imageContainer}>
            {cafe.profile_image_url ? (
              <Image
                source={{ uri: cafe.profile_image_url }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]}>
                <FontAwesome name="coffee" size={48} color="#999" />
              </View>
            )}
          </View>
          <View style={styles.content}>
            <Text style={[styles.cafeName, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
              {cafe.name}
            </Text>
            <Text style={styles.cafeAddress}>{cafe.address}</Text>
            <View style={styles.ratingContainer}>
              <View style={styles.ratingStarsContainer}>
                <Text style={[styles.rating, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
                  {rating.toFixed(1)}
                </Text>
                <FontAwesome name="star" size={16} color="#FFD700" style={styles.ratingStar} />
              </View>
              <TouchableOpacity
                style={styles.reviewsButton}
                onPress={() => setShowReviews((prev) => !prev)}
              >
                <Text style={styles.reviewsText}>
                  {showReviews ? 'Hide reviews' : `See ${reviews.length} reviews`}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.openStatus, { color: isOpen ? '#4CAF50' : '#F44336' }]}>
                {isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>

          <View style={styles.categoriesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category && styles.categoryButtonSelected,
                  ]}
                  onPress={() => setSelectedCategory(
                    selectedCategory === category ? null : category
                  )}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    selectedCategory === category && styles.categoryButtonTextSelected,
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.menuContainer}>
            {availableItems.length === 0 && (
              <Text style={styles.emptyMenuText}>No menu items available right now.</Text>
            )}
            {visibleCategories.map(category => (
              <View key={category}>
                <Text
                  style={[
                    styles.menuCategoryTitle,
                    { color: colorScheme === 'dark' ? '#fff' : '#000' },
                  ]}
                >
                  {category}
                </Text>
                {itemsForCategory(category).map(item => (
                  <View key={item.menu_item_id} style={styles.menuItem}>
                    {item.image_url && (
                      <Image
                        source={{ uri: item.image_url }}
                        style={styles.menuItemImage}
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.menuItemInfo}>
                      <Text style={[styles.menuItemName, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
                        {item.name}
                      </Text>
                      {item.description ? (
                        <Text style={styles.menuItemDescription}>{item.description}</Text>
                      ) : null}
                      <Text style={styles.menuItemPrice}>${Number(item.price).toFixed(2)}</Text>
                    </View>
                    <View style={styles.menuItemActions}>
                      {quantityInCart(item.menu_item_id) > 0 ? (
                        <View style={styles.quantityControls}>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => decrementItem(item)}
                          >
                            <FontAwesome name="minus" size={16} color="#007AFF" />
                          </TouchableOpacity>
                          <Text
                            style={[styles.quantity, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
                          >
                            {quantityInCart(item.menu_item_id)}
                          </Text>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => addToCart(item)}
                          >
                            <FontAwesome name="plus" size={16} color="#007AFF" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.addButton}
                          onPress={() => addToCart(item)}
                        >
                          <Text style={styles.addButtonText}>Add</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>

          {showReviews && (
            <View style={dynamicStyles.reviewsSection}>
              <View style={styles.reviewsHeader}>
                <Text style={dynamicStyles.reviewsTitle}>Reviews</Text>
                <TouchableOpacity
                  style={styles.writeReviewButton}
                  onPress={() => Alert.alert('Coming Soon', 'Write a review feature will be available soon!')}
                >
                  <FontAwesome name="pencil" size={16} color="#007AFF" />
                  <Text style={styles.writeReviewText}>Write a Review</Text>
                </TouchableOpacity>
              </View>
              <View style={dynamicStyles.overallRating}>
                <Text style={dynamicStyles.ratingNumber}>{rating.toFixed(1)}</Text>
                <View style={styles.ratingStars}>
                  {[...Array(5)].map((_, index) => (
                    <FontAwesome
                      key={index}
                      name={index < Math.floor(rating) ? 'star' : index < rating ? 'star-half-o' : 'star-o'}
                      size={24}
                      color="#FFD700"
                      style={styles.ratingStar}
                    />
                  ))}
                </View>
                <Text style={styles.totalReviews}>{reviews.length} reviews</Text>
              </View>
              {reviews.length === 0 && (
                <Text style={styles.totalReviews}>No reviews yet. Be the first to leave one!</Text>
              )}
              {reviews.map(review => (
                <View key={review.review_id} style={dynamicStyles.review}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerInfo}>
                      <View style={styles.reviewerAvatar}>
                        <FontAwesome name="user-circle" size={32} color="#666" />
                      </View>
                      <View>
                        <Text style={dynamicStyles.reviewerName}>BREAK customer</Text>
                        <Text style={styles.reviewDate}>
                          {new Date(review.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.reviewRating}>
                      {[...Array(5)].map((_, index) => (
                        <FontAwesome
                          key={index}
                          name={index < review.rating ? 'star' : 'star-o'}
                          size={16}
                          color="#FFD700"
                        />
                      ))}
                    </View>
                  </View>
                  {review.comment ? (
                    <Text style={dynamicStyles.reviewComment}>{review.comment}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {isThisCafesCart && cart.items.length > 0 && (
          <View style={styles.cartBar}>
            <View style={styles.cartInfo}>
              <Text style={styles.cartItemCount}>
                {cart.itemCount} items
              </Text>
              <Text style={[styles.cartTotal, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
                ${cart.subtotal.toFixed(2)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutButtonText}>Checkout</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
  },
  notFoundButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  notFoundButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
  },
  imagePlaceholder: {
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  cafeName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cafeAddress: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingStarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  ratingStar: {
    marginRight: 4,
  },
  reviewsButton: {
    marginRight: 16,
  },
  reviewsText: {
    color: '#007AFF',
    fontSize: 14,
  },
  openStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f5f5f5',
  },
  categoryButtonSelected: {
    backgroundColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
  },
  categoryButtonTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  menuContainer: {
    padding: 16,
  },
  menuCategoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  emptyMenuText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 24,
  },
  menuItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  menuItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  menuItemActions: {
    alignItems: 'flex-end',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    fontSize: 16,
    marginHorizontal: 12,
  },
  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cartInfo: {
    flex: 1,
  },
  cartItemCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cartTotal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkoutButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  writeReviewText: {
    marginLeft: 8,
    color: '#007AFF',
    fontSize: 14,
  },
  ratingStars: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  totalReviews: {
    fontSize: 14,
    color: '#666',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewerAvatar: {
    marginRight: 12,
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
  },
  reviewRating: {
    flexDirection: 'row',
  },
});
