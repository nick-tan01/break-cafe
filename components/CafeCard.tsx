import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, useColorScheme } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export interface CafeCardProps {
  name: string;
  address: string;
  rating: number;
  isOpen: boolean;
  image: string | null;
  /** Pre-formatted distance label (e.g. "1.2 mi"). Omit/null to hide. */
  distance?: string | null;
  onPress: () => void;
}

export default function CafeCard({ name, address, rating, isOpen, image, distance, onPress }: CafeCardProps) {
  const colorScheme = useColorScheme();

  return (
    <TouchableOpacity
      style={[styles.cafeCard, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }]}
      onPress={onPress}
    >
      <Image source={{ uri: image ?? undefined }} style={styles.cafeImage} />
      <View style={styles.cafeInfo}>
        <Text style={[styles.cafeName, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>{name}</Text>
        <Text style={styles.cafeAddress}>{address}</Text>
        <View style={styles.cafeStats}>
          <View style={styles.ratingContainer}>
            <FontAwesome name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>{rating}</Text>
          </View>
          {distance != null && <Text style={styles.distance}>{distance}</Text>}
          <View style={[styles.openStatus, { backgroundColor: isOpen ? '#4CAF50' : '#F44336' }]}>
            <Text style={styles.openStatusText}>{isOpen ? 'Open' : 'Closed'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cafeCard: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cafeImage: {
    width: 120,
    height: 120,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  cafeInfo: {
    flex: 1,
    padding: 12,
  },
  cafeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cafeAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cafeStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  distance: {
    fontSize: 14,
    color: '#666',
    marginRight: 16,
  },
  openStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  openStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
