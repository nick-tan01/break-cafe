import { StyleSheet, View, Text, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

import { colors, fonts, glassCard, display } from '../../../lib/theme';
import GradientScreen from '../../../components/GradientScreen';

interface Review {
  id: string;
  userName: string;
  userImage: string;
  rating: number;
  date: string;
  comment: string;
  images?: string[];
}

// Mock reviews data
const MOCK_REVIEWS: Review[] = [
  {
    id: '1',
    userName: 'Sarah Johnson',
    userImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    rating: 4.5,
    date: '2024-03-15',
    comment: 'Amazing coffee and atmosphere! The baristas are very skilled and friendly. Love their specialty drinks.',
    images: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500',
    ],
  },
  {
    id: '2',
    userName: 'Michael Chen',
    userImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    rating: 5,
    date: '2024-03-14',
    comment: 'Best croissants in town! Everything is freshly baked and the coffee is perfect. Highly recommend their breakfast menu.',
    images: [
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500',
    ],
  },
  {
    id: '3',
    userName: 'Emma Wilson',
    userImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    rating: 4,
    date: '2024-03-13',
    comment: 'Great place to work remotely. Fast wifi and plenty of power outlets. The cold brew is exceptional.',
  },
];

export default function ReviewsScreen() {
  const { id } = useLocalSearchParams();

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(
          <FontAwesome key={i} name="star" size={16} color={colors.gold} style={styles.star} />
        );
      } else if (i - rating === 0.5) {
        stars.push(
          <FontAwesome key={i} name="star-half-o" size={16} color={colors.gold} style={styles.star} />
        );
      } else {
        stars.push(
          <FontAwesome key={i} name="star-o" size={16} color={colors.inkMuted} style={styles.star} />
        );
      }
    }
    return stars;
  };

  return (
    <GradientScreen>
      <Stack.Screen
        options={{
          headerTitle: 'Reviews',
          headerStyle: {
            backgroundColor: colors.gradient[0],
          },
          headerTintColor: colors.ink,
          headerTitleStyle: {
            fontFamily: fonts.display,
            fontSize: 18,
          },
          headerShadowVisible: false,
          headerBackTitle: ' ',
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <Text style={styles.averageRating}>4.5</Text>
          <View style={styles.starsContainer}>
            {renderStars(4.5)}
          </View>
          <Text style={styles.totalReviews}>Based on {MOCK_REVIEWS.length} reviews</Text>
        </View>

        <View style={styles.reviewsContainer}>
          {MOCK_REVIEWS.map(review => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Image source={{ uri: review.userImage }} style={styles.userImage} />
                <View style={styles.reviewHeaderText}>
                  <Text style={styles.userName}>{review.userName}</Text>
                  <View style={styles.ratingContainer}>
                    {renderStars(review.rating)}
                    <Text style={styles.reviewDate}>
                      {new Date(review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.reviewText}>{review.comment}</Text>

              {review.images && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.imagesContainer}
                >
                  {review.images.map((image, index) => (
                    <Image
                      key={index}
                      source={{ uri: image }}
                      style={styles.reviewImage}
                    />
                  ))}
                </ScrollView>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  averageRating: {
    ...display(44),
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  star: {
    marginHorizontal: 2,
  },
  totalReviews: {
    fontFamily: fonts.light,
    fontSize: 13,
    letterSpacing: 0.4,
    color: colors.inkSoft,
  },
  reviewsContainer: {
    padding: 18,
  },
  reviewCard: {
    ...glassCard,
    padding: 16,
    marginBottom: 14,
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginRight: 12,
  },
  reviewHeaderText: {
    flex: 1,
  },
  userName: {
    fontFamily: fonts.medium,
    fontSize: 15,
    letterSpacing: 0.5,
    color: colors.ink,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewDate: {
    fontFamily: fonts.light,
    fontSize: 12,
    color: colors.inkMuted,
    marginLeft: 8,
  },
  reviewText: {
    fontFamily: fonts.light,
    fontSize: 13.5,
    letterSpacing: 0.2,
    color: colors.ink,
    lineHeight: 20,
    marginBottom: 12,
  },
  imagesContainer: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  reviewImage: {
    width: 200,
    height: 150,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginRight: 8,
  },
});
