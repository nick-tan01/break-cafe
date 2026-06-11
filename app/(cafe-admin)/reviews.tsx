import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, TextInput, Modal, Alert, FlatList } from 'react-native';
import { FontAwesome, Feather } from '@expo/vector-icons';

import { colors, fonts, glassCard, display, overline } from '../../lib/theme';
import GradientScreen from '../../components/GradientScreen';

interface Reply {
  id: string;
  text: string;
  date: string;
}

interface Review {
  id: string;
  userName: string;
  userImage?: string;
  rating: number;
  date: string;
  text: string;
  images?: string[];
  reply?: Reply;
}

const MOCK_REVIEWS: Review[] = [
  {
    id: '1',
    userName: 'John Doe',
    userImage: 'https://randomuser.me/api/portraits/men/32.jpg',
    rating: 5,
    date: '2024-03-15',
    text: 'Amazing coffee and pastries! The atmosphere is cozy and perfect for working or catching up with friends.',
    images: ['https://picsum.photos/200/200'],
    reply: {
      id: '1',
      text: 'Thank you for your kind words! We\'re glad you enjoyed your visit.',
      date: '2024-03-15'
    }
  },
  {
    id: '2',
    userName: 'Jane Smith',
    userImage: 'https://randomuser.me/api/portraits/women/44.jpg',
    rating: 4,
    date: '2024-03-14',
    text: 'Great service and delicious food. The latte art is beautiful!',
    images: ['https://picsum.photos/200/200', 'https://picsum.photos/200/200']
  },
  {
    id: '3',
    userName: 'Mike Johnson',
    userImage: 'https://randomuser.me/api/portraits/men/22.jpg',
    rating: 3,
    date: '2024-03-13',
    text: 'The coffee was good but the place was a bit crowded during peak hours.',
    images: ['https://picsum.photos/200/200']
  },
  {
    id: '4',
    userName: 'Sarah Wilson',
    userImage: 'https://randomuser.me/api/portraits/women/67.jpg',
    rating: 5,
    date: '2024-03-12',
    text: 'Best croissants in town! Will definitely come back.',
    images: ['https://picsum.photos/200/200']
  }
];

const FILTER_RATINGS = [
  { id: 'all', label: 'All', icon: 'star' },
  { id: '5', label: '5 Stars', icon: 'star' },
  { id: '4', label: '4 Stars', icon: 'star' },
  { id: '3', label: '3 Stars', icon: 'star' },
  { id: '2', label: '2 Stars', icon: 'star' },
  { id: '1', label: '1 Star', icon: 'star' },
];

export default function ReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [selectedRating, setSelectedRating] = useState('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplyModalVisible, setIsReplyModalVisible] = useState(false);

  const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
  const ratingCounts = reviews.reduce((acc, review) => {
    acc[review.rating] = (acc[review.rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const filteredReviews = reviews.filter(review =>
    selectedRating === 'all' || review.rating === parseInt(selectedRating)
  );

  const handleReply = (review: Review) => {
    setSelectedReview(review);
    setReplyText('');
    setIsReplyModalVisible(true);
  };

  const handleSubmitReply = () => {
    if (!selectedReview || !replyText.trim()) return;

    // Check if review already has a reply
    if (selectedReview.reply) {
      Alert.alert('Error', 'This review already has a reply');
      return;
    }

    // Validate reply length
    if (replyText.trim().length < 10) {
      Alert.alert('Error', 'Reply must be at least 10 characters long');
      return;
    }

    const newReply: Reply = {
      id: Date.now().toString(),
      text: replyText.trim(),
      date: new Date().toISOString().split('T')[0]
    };

    setReviews(prevReviews =>
      prevReviews.map(review =>
        review.id === selectedReview.id
          ? { ...review, reply: newReply }
          : review
      )
    );

    setIsReplyModalVisible(false);
    setSelectedReview(null);
    setReplyText('');
    Alert.alert('Success', 'Reply submitted successfully');
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, index) => (
      <FontAwesome
        key={index}
        name={index < rating ? 'star' : 'star-o'}
        size={16}
        color={index < rating ? colors.gold : colors.inkMuted}
        style={styles.star}
      />
    ));
  };

  const renderFilterRating = ({ item }: { item: typeof FILTER_RATINGS[0] }) => {
    const count = item.id === 'all'
      ? reviews.length
      : reviews.filter(review => review.rating === parseInt(item.id)).length;
    const isOn = selectedRating === item.id;

    return (
      <TouchableOpacity
        style={[styles.filterChip, isOn && styles.filterChipOn]}
        onPress={() => setSelectedRating(item.id)}
      >
        <Text style={[styles.filterChipText, isOn && styles.filterChipTextOn]}>
          {item.label} ({count})
        </Text>
      </TouchableOpacity>
    );
  };

  const renderReviewCard = ({ item: review }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: review.userImage }}
            style={styles.userImage}
          />
          <View>
            <Text style={styles.userName}>{review.userName}</Text>
            <Text style={styles.reviewDate}>{review.date}</Text>
          </View>
        </View>
        <View style={styles.ratingContainer}>
          {renderStars(review.rating)}
        </View>
      </View>

      <Text style={styles.reviewText}>{review.text}</Text>

      {review.images && review.images.length > 0 && (
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

      {review.reply ? (
        <View style={styles.replyContainer}>
          <View style={styles.replyHeader}>
            <Feather name="corner-down-right" size={14} color={colors.sage} />
            <Text style={styles.replyLabel}>Your Reply</Text>
            <Text style={styles.replyDate}>{review.reply.date}</Text>
          </View>
          <Text style={styles.replyText}>{review.reply.text}</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.replyButton}
          onPress={() => handleReply(review)}
        >
          <Feather name="corner-up-left" size={15} color={colors.sage} />
          <Text style={styles.replyButtonText}>Reply to Review</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <GradientScreen>
      <FlatList
        ListHeaderComponent={
          <>
            {/* Rating Overview */}
            <View style={styles.overviewCard}>
              <View style={styles.overviewHeader}>
                <View style={styles.overviewRating}>
                  <Text style={styles.averageRating}>
                    {averageRating.toFixed(1)}
                  </Text>
                  <View style={styles.starsContainer}>
                    {renderStars(Math.round(averageRating))}
                  </View>
                  <Text style={styles.totalReviews}>
                    {reviews.length} total reviews
                  </Text>
                </View>
                <View style={styles.ratingBreakdown}>
                  {[5, 4, 3, 2, 1].map(rating => (
                    <TouchableOpacity
                      key={rating}
                      style={styles.ratingRow}
                      onPress={() => setSelectedRating(rating.toString())}
                    >
                      <Text style={styles.ratingLabel}>{rating}</Text>
                      <View style={styles.ratingBarContainer}>
                        <View
                          style={[
                            styles.ratingBar,
                            { width: `${((ratingCounts[rating] || 0) / reviews.length) * 100}%` }
                          ]}
                        />
                      </View>
                      <Text style={styles.ratingCount}>
                        {ratingCounts[rating] || 0}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Rating Filters */}
            <FlatList
              data={FILTER_RATINGS}
              renderItem={renderFilterRating}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterList}
              contentContainerStyle={styles.filterListContent}
            />
          </>
        }
        data={filteredReviews}
        renderItem={renderReviewCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.reviewsList}
        showsVerticalScrollIndicator={false}
      />

      {/* Reply Modal */}
      <Modal
        visible={isReplyModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reply to Review</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsReplyModalVisible(false)}
              >
                <Feather name="x" size={22} color={colors.inkSoft} />
              </TouchableOpacity>
            </View>

            {selectedReview && (
              <View style={styles.selectedReview}>
                <View style={styles.selectedReviewHeader}>
                  <Image
                    source={{ uri: selectedReview.userImage }}
                    style={styles.selectedReviewUserImage}
                  />
                  <View>
                    <Text style={styles.selectedReviewUserName}>
                      {selectedReview.userName}
                    </Text>
                    <View style={styles.selectedReviewRating}>
                      {renderStars(selectedReview.rating)}
                    </View>
                  </View>
                </View>
                <Text style={styles.selectedReviewText}>
                  {selectedReview.text}
                </Text>
              </View>
            )}

            <TextInput
              style={styles.replyInput}
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Write your reply..."
              placeholderTextColor={colors.inkMuted}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsReplyModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { opacity: !replyText.trim() ? 0.6 : 1 }
                ]}
                onPress={handleSubmitReply}
                disabled={!replyText.trim()}
              >
                <Text style={styles.submitButtonText}>Submit Reply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  overviewCard: {
    ...glassCard,
    borderRadius: 12,
    padding: 17,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  overviewRating: {
    alignItems: 'center',
    marginRight: 20,
  },
  averageRating: {
    ...display(40),
    marginBottom: 6,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  star: {
    marginHorizontal: 1,
  },
  totalReviews: {
    fontFamily: fonts.light,
    fontSize: 12,
    letterSpacing: 0.3,
    color: colors.inkSoft,
  },
  ratingBreakdown: {
    flex: 1,
    justifyContent: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  ratingLabel: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.ink,
    width: 18,
  },
  ratingBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: colors.hairlineFaint,
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  ratingBar: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.sage,
  },
  ratingCount: {
    fontFamily: fonts.light,
    fontSize: 12,
    color: colors.inkMuted,
    width: 20,
    textAlign: 'right',
  },
  filterList: {
    marginHorizontal: -18,
    marginTop: 13,
    marginBottom: 13,
  },
  filterListContent: {
    paddingHorizontal: 18,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
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
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.inkSoft,
  },
  filterChipTextOn: {
    color: colors.white,
    fontFamily: fonts.semibold,
  },
  reviewsList: {
    padding: 18,
    paddingTop: 14,
    paddingBottom: 32,
  },
  reviewCard: {
    ...glassCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 13,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 11,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginRight: 12,
  },
  userName: {
    fontFamily: fonts.medium,
    fontSize: 15,
    letterSpacing: 0.5,
    color: colors.ink,
    marginBottom: 3,
  },
  reviewDate: {
    fontFamily: fonts.light,
    fontSize: 12,
    letterSpacing: 0.2,
    color: colors.inkMuted,
  },
  ratingContainer: {
    flexDirection: 'row',
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
    marginBottom: 12,
  },
  reviewImage: {
    width: 120,
    height: 120,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginRight: 8,
  },
  replyContainer: {
    backgroundColor: colors.sageTint,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 10,
    padding: 12,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  replyLabel: {
    ...overline(10),
    letterSpacing: 1.6,
    marginLeft: 7,
    marginRight: 'auto',
  },
  replyDate: {
    fontFamily: fonts.light,
    fontSize: 11.5,
    color: colors.inkMuted,
  },
  replyText: {
    fontFamily: fonts.light,
    fontSize: 13,
    letterSpacing: 0.2,
    color: colors.ink,
    lineHeight: 19,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.sageBorder,
    backgroundColor: colors.glassSoft,
  },
  replyButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.sage,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(35,43,58,0.45)',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineFaint,
  },
  modalTitle: {
    ...display(18),
    letterSpacing: 1.6,
  },
  closeButton: {
    padding: 4,
  },
  selectedReview: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineFaint,
  },
  selectedReviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedReviewUserImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginRight: 12,
  },
  selectedReviewUserName: {
    fontFamily: fonts.medium,
    fontSize: 14,
    letterSpacing: 0.4,
    color: colors.ink,
    marginBottom: 3,
  },
  selectedReviewRating: {
    flexDirection: 'row',
  },
  selectedReviewText: {
    fontFamily: fonts.light,
    fontSize: 13,
    letterSpacing: 0.2,
    color: colors.inkSoft,
    lineHeight: 19,
  },
  replyInput: {
    margin: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.sageBorder,
    backgroundColor: colors.glassSoft,
    fontFamily: fonts.light,
    fontSize: 14,
    color: colors.ink,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineFaint,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(35,43,58,0.2)',
    backgroundColor: colors.glassSoft,
  },
  cancelButtonText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.inkSoft,
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: colors.sage,
  },
  submitButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.white,
  },
});
