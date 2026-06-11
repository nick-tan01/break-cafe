import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '../../lib/supabase';
import { useCart } from '../../lib/cart';
import { colors, fonts, radius, glassCard, display, overline, primaryButton, primaryButtonText } from '../../lib/theme';
import GradientScreen from '../../components/GradientScreen';

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
  const insets = useSafeAreaInsets();
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

  if (isLoading) {
    return (
      <GradientScreen>
        <Stack.Screen options={{ headerShown: false }} />
        <TouchableOpacity
          style={[styles.roundBtn, styles.floatingBack, { top: insets.top + 8 }]}
          onPress={() => router.back()}
        >
          <Feather name="chevron-left" size={20} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.sage} />
        </View>
      </GradientScreen>
    );
  }

  if (!cafe) {
    return (
      <GradientScreen>
        <Stack.Screen options={{ headerShown: false }} />
        <TouchableOpacity
          style={[styles.roundBtn, styles.floatingBack, { top: insets.top + 8 }]}
          onPress={() => router.back()}
        >
          <Feather name="chevron-left" size={20} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.centerContainer}>
          <Feather name="coffee" size={44} color={colors.inkMuted} />
          <Text style={styles.notFoundText}>Cafe not found</Text>
          <TouchableOpacity style={[primaryButton, styles.notFoundButton]} onPress={() => router.back()}>
            <Text style={primaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </GradientScreen>
    );
  }

  return (
    <GradientScreen>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.hero}>
            {cafe.profile_image_url ? (
              <Image
                source={{ uri: cafe.profile_image_url }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.heroImage, styles.heroPlaceholder]}>
                <Feather name="coffee" size={44} color={colors.inkMuted} />
              </View>
            )}
            <View style={[styles.navBtns, { top: insets.top + 8 }]}>
              <TouchableOpacity style={styles.roundBtn} onPress={() => router.back()}>
                <Feather name="chevron-left" size={20} color={colors.ink} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.kicker}>{cafe.address}</Text>
            <Text style={styles.cafeName}>{cafe.name}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaRating}>
                <FontAwesome name="star" size={12} color={colors.gold} />
                <Text style={styles.metaRatingText}>{rating.toFixed(1)}</Text>
              </View>
              <View style={styles.metaDot} />
              <Text style={[styles.metaText, !isOpen && styles.metaTextClosed]}>
                {isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.reviewsToggle}
              onPress={() => setShowReviews((prev) => !prev)}
            >
              <Text style={styles.reviewsToggleText}>
                {showReviews ? 'Hide reviews' : `See ${reviews.length} reviews`}
              </Text>
            </TouchableOpacity>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.catChipsScroll}
              contentContainerStyle={styles.catChips}
            >
              {categories.map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.chip,
                    selectedCategory === category && styles.chipOn,
                  ]}
                  onPress={() => setSelectedCategory(
                    selectedCategory === category ? null : category
                  )}
                >
                  <Text style={[
                    styles.chipText,
                    selectedCategory === category && styles.chipTextOn,
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {availableItems.length === 0 && (
              <Text style={styles.emptyMenuText}>No menu items available right now.</Text>
            )}
            {visibleCategories.map(category => (
              <View key={category}>
                <View style={styles.menuSec}>
                  <View style={styles.menuSecLine} />
                  <Text style={styles.menuSecText}>{category}</Text>
                  <View style={styles.menuSecLine} />
                </View>
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
                      <Text style={styles.menuItemName}>{item.name}</Text>
                      {item.description ? (
                        <Text style={styles.menuItemDescription}>{item.description}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.menuItemPrice}>${Number(item.price).toFixed(2)}</Text>
                    {quantityInCart(item.menu_item_id) > 0 ? (
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={styles.addBtn}
                          onPress={() => decrementItem(item)}
                        >
                          <Feather name="minus" size={14} color={colors.sage} />
                        </TouchableOpacity>
                        <Text style={styles.quantity}>
                          {quantityInCart(item.menu_item_id)}
                        </Text>
                        <TouchableOpacity
                          style={styles.addBtn}
                          onPress={() => addToCart(item)}
                        >
                          <Feather name="plus" size={14} color={colors.sage} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => addToCart(item)}
                      >
                        <Feather name="plus" size={14} color={colors.sage} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            ))}

            {showReviews && (
              <View style={styles.reviewsSection}>
                <View style={styles.reviewsHeader}>
                  <Text style={styles.reviewsTitle}>Reviews</Text>
                  <TouchableOpacity
                    style={styles.writeReviewButton}
                    onPress={() => Alert.alert('Coming Soon', 'Write a review feature will be available soon!')}
                  >
                    <Feather name="edit-3" size={14} color={colors.sage} />
                    <Text style={styles.writeReviewText}>Write a Review</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.overallRating}>
                  <Text style={styles.ratingNumber}>{rating.toFixed(1)}</Text>
                  <View style={styles.ratingStars}>
                    {[...Array(5)].map((_, index) => (
                      <FontAwesome
                        key={index}
                        name={index < Math.floor(rating) ? 'star' : index < rating ? 'star-half-o' : 'star-o'}
                        size={20}
                        color={index < rating ? colors.gold : colors.inkMuted}
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
                  <View key={review.review_id} style={styles.review}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewerInfo}>
                        <View style={styles.reviewerAvatar}>
                          <Feather name="user" size={16} color={colors.sage} />
                        </View>
                        <View>
                          <Text style={styles.reviewerName}>BREAK customer</Text>
                          <Text style={styles.reviewDate}>
                            {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.reviewRating}>
                        {[...Array(5)].map((_, index) => (
                          <FontAwesome
                            key={index}
                            name={index < review.rating ? 'star' : 'star-o'}
                            size={14}
                            color={index < review.rating ? colors.gold : colors.inkMuted}
                          />
                        ))}
                      </View>
                    </View>
                    {review.comment ? (
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {isThisCafesCart && cart.items.length > 0 && (
          <TouchableOpacity
            style={[styles.cartBar, { bottom: insets.bottom + 12 }]}
            activeOpacity={0.85}
            onPress={handleCheckout}
          >
            <Text style={styles.cartBarText}>
              {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'} · View order
            </Text>
            <Text style={styles.cartBarText}>${cart.subtotal.toFixed(2)}</Text>
          </TouchableOpacity>
        )}
      </View>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  floatingBack: {
    position: 'absolute',
    left: 18,
    zIndex: 2,
  },
  notFoundText: {
    ...display(20),
    marginTop: 16,
    marginBottom: 24,
  },
  notFoundButton: {
    paddingHorizontal: 32,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  hero: {
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 240,
  },
  heroPlaceholder: {
    backgroundColor: colors.glassSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtns: {
    position: 'absolute',
    left: 18,
    right: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roundBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.round,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCard: {
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.glass,
    paddingTop: 32,
    paddingHorizontal: 22,
    minHeight: 400,
  },
  kicker: {
    ...overline(10),
    letterSpacing: 3,
    textAlign: 'center',
  },
  cafeName: {
    ...display(26),
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  metaRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaRatingText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.ink,
    marginLeft: 4,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: radius.round,
    backgroundColor: colors.sageBorder,
    marginHorizontal: 8,
  },
  metaText: {
    fontFamily: fonts.light,
    fontSize: 12.5,
    letterSpacing: 0.5,
    color: colors.sage,
  },
  metaTextClosed: {
    color: colors.inkMuted,
  },
  reviewsToggle: {
    alignSelf: 'center',
    marginTop: 10,
    paddingVertical: 4,
  },
  reviewsToggleText: {
    ...overline(10.5),
    letterSpacing: 1.7,
  },
  // flexGrow 0 + centered items keep the chips at their natural height —
  // horizontal ScrollViews otherwise stretch children to fill leftover space
  catChipsScroll: {
    flexGrow: 0,
  },
  catChips: {
    paddingVertical: 16,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  chip: {
    alignSelf: 'center',
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: 'rgba(79,130,104,0.32)',
    backgroundColor: 'rgba(255,255,255,0.45)',
    marginRight: 8,
  },
  chipOn: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: colors.inkSoft,
  },
  chipTextOn: {
    color: colors.white,
    fontFamily: fonts.semibold,
  },
  emptyMenuText: {
    fontFamily: fonts.light,
    fontSize: 13.5,
    letterSpacing: 0.3,
    color: colors.inkSoft,
    textAlign: 'center',
    paddingVertical: 24,
  },
  menuSec: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 4,
  },
  menuSecLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.hairline,
  },
  menuSecText: {
    fontFamily: fonts.display,
    fontSize: 14,
    letterSpacing: 2.8,
    textTransform: 'uppercase',
    color: colors.sage,
    marginHorizontal: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineFaint,
  },
  menuItemImage: {
    width: 52,
    height: 52,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginRight: 12,
  },
  menuItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  menuItemName: {
    fontFamily: fonts.medium,
    fontSize: 15,
    letterSpacing: 0.6,
    color: colors.ink,
  },
  menuItemDescription: {
    fontFamily: fonts.light,
    fontSize: 12,
    letterSpacing: 0.2,
    color: colors.inkSoft,
    marginTop: 3,
  },
  menuItemPrice: {
    fontFamily: fonts.medium,
    fontSize: 14,
    letterSpacing: 0.6,
    color: colors.sage,
    marginRight: 12,
  },
  addBtn: {
    width: 31,
    height: 31,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: 'rgba(79,130,104,0.5)',
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantity: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
    marginHorizontal: 9,
  },
  reviewsSection: {
    ...glassCard,
    padding: 17,
    marginTop: 20,
    marginBottom: 8,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  reviewsTitle: {
    ...display(18),
    letterSpacing: 1.8,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  writeReviewText: {
    ...overline(10.5),
    letterSpacing: 1.5,
    marginLeft: 7,
  },
  overallRating: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: radius.control,
    backgroundColor: colors.sageTint,
  },
  ratingNumber: {
    ...display(40),
    marginBottom: 8,
  },
  ratingStars: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  ratingStar: {
    marginHorizontal: 2,
  },
  totalReviews: {
    fontFamily: fonts.light,
    fontSize: 12.5,
    letterSpacing: 0.4,
    color: colors.inkSoft,
  },
  review: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineFaint,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.sageBorder,
    backgroundColor: colors.sageTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  reviewerName: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    letterSpacing: 0.4,
    color: colors.ink,
  },
  reviewDate: {
    fontFamily: fonts.light,
    fontSize: 11.5,
    color: colors.inkMuted,
    marginTop: 2,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontFamily: fonts.light,
    fontSize: 13.5,
    letterSpacing: 0.2,
    color: colors.ink,
    lineHeight: 20,
  },
  cartBar: {
    position: 'absolute',
    left: 18,
    right: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.sage,
    borderRadius: radius.control,
    paddingVertical: 15,
    paddingHorizontal: 22,
    shadowColor: colors.sage,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 4,
  },
  cartBarText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: colors.white,
  },
});
