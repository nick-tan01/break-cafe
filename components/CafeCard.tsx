import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { colors, fonts, glassCard } from '../lib/theme';

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
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {image ? (
        <Image source={{ uri: image }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback]} />
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {distance != null ? `${distance} · ${address}` : address}
        </Text>
        <View style={styles.statRow}>
          <FontAwesome name="star" size={12} color={colors.gold} />
          <Text style={styles.rating}>{rating ? rating.toFixed(1) : '—'}</Text>
          <Text style={isOpen ? styles.openMark : styles.closedMark}>
            {isOpen ? 'Open now' : 'Closed'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    ...glassCard,
    flexDirection: 'row',
    padding: 12,
    marginBottom: 12,
  },
  thumb: {
    width: 92,
    height: 92,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  thumbFallback: {
    backgroundColor: colors.sky,
  },
  info: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 18,
    letterSpacing: 0.9,
    color: colors.ink,
  },
  meta: {
    fontFamily: fonts.light,
    fontSize: 12.5,
    letterSpacing: 0.4,
    color: colors.inkSoft,
    marginTop: 5,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  rating: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.ink,
    marginLeft: 4,
    marginRight: 12,
  },
  openMark: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    letterSpacing: 0.5,
    color: colors.sage,
  },
  closedMark: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    letterSpacing: 0.5,
    color: colors.inkMuted,
  },
});
