import { StyleSheet, FlatList, View, Text, TouchableOpacity, Dimensions, TextInput, TouchableWithoutFeedback, Keyboard, Modal, Pressable } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useEffect, useState, useRef } from 'react';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React from 'react';

import { supabase } from '../../lib/supabase';
import { getDistanceInMiles } from '../../lib/distance';
import { colors, fonts, glassCard, display, overline, primaryButton, primaryButtonText } from '../../lib/theme';
import CafeCard from '../../components/CafeCard';
import GradientScreen from '../../components/GradientScreen';

// Map component dimensions
const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

interface Cafe {
  id: string;
  name: string;
  address: string;
  rating: number;
  distance: string | null;
  image: string;
  isOpen: boolean;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function dateKicker(): string {
  const now = new Date();
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  return `${weekday} · ${monthDay}`;
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'distance' | 'rating'>('distance');
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  // null = no distance limit; only applies when we actually know the location
  const [maxDistance, setMaxDistance] = useState<number | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      setIsLoading(true);

      // Location is optional: it powers distance labels, sorting, and the
      // distance filter, but cafes are always shown even without it.
      let loc: Location.LocationObject | null = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setLocation(loc);
          setErrorMsg(null);
        } else {
          setErrorMsg('Location is off — showing all cafes');
        }
      } catch (error) {
        console.error('Location error:', error);
        setErrorMsg('Location unavailable — showing all cafes');
      }

      try {
        const dayOfWeek = new Date().getDay() === 0 ? 7 : new Date().getDay();
        const currentTime = new Date().toTimeString().slice(0, 5);

        const { data, error } = await supabase
          .from('cafes')
          .select(`
            *,
            cafe_hours (
              opening_time,
              closing_time,
              is_closed,
              day_of_week
            )
          `)
          .eq('is_active', true);

        if (error) {
          console.error('Error fetching cafes:', error);
          setErrorMsg('Could not load cafes.');
        } else {
          let filtered = data.map((cafe) => {
            const lat = parseFloat(cafe.latitude);
            const lon = parseFloat(cafe.longitude);
            const distance = loc
              ? getDistanceInMiles(loc.coords.latitude, loc.coords.longitude, lat, lon)
              : null;
            const hours: { opening_time: string; closing_time: string; is_closed: boolean; day_of_week: number } | undefined = cafe.cafe_hours?.find((h: { opening_time: string; closing_time: string; is_closed: boolean; day_of_week: number }) => h.day_of_week === dayOfWeek);
            let isOpen = false;
            if (hours && !hours.is_closed) {
              isOpen = currentTime >= hours.opening_time && currentTime <= hours.closing_time;
            }
            return {
              id: cafe.cafe_id,
              name: cafe.name,
              address: cafe.address,
              rating: Number(cafe.avg_rating || 0),
              distance: distance != null ? `${distance.toFixed(1)} mi` : null,
              image: cafe.profile_image_url,
              isOpen,
              coordinates: { latitude: lat, longitude: lon },
              distanceRaw: distance
            };
          });

          if (showOnlyOpen) filtered = filtered.filter(c => c.isOpen);
          if (maxDistance != null) {
            filtered = filtered.filter(c => c.distanceRaw == null || c.distanceRaw <= maxDistance);
          }
          if (sortBy === 'rating' || !loc) filtered.sort((a, b) => b.rating - a.rating);
          else filtered.sort((a, b) => (a.distanceRaw ?? Infinity) - (b.distanceRaw ?? Infinity));

          setCafes(filtered);
        }
      } catch (error) {
        console.error('Error fetching cafes:', error);
        setErrorMsg('Could not load cafes.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [maxDistance, sortBy, showOnlyOpen]);

  // Function to animate to user's location on the map
  const goToUserLocation = () => {
    if (!location || !mapRef.current) return;

    mapRef.current.animateToRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    }, 1000);
  };

  const renderCafeItem = ({ item }: { item: Cafe }) => (
    <CafeCard
      name={item.name}
      address={item.address}
      rating={item.rating}
      isOpen={item.isOpen}
      image={item.image}
      distance={item.distance}
      onPress={() => router.push(`/cafe/${item.id}`)}
    />
  );

  return (
    <GradientScreen>
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <View style={styles.greet}>
          <Text style={styles.greetDate}>{dateKicker()}</Text>
          <Text style={styles.greetTitle}>{greetingForNow()}</Text>
          <Text style={styles.greetSub}>
            {isLoading
              ? 'Pouring shortly…'
              : cafes.length > 0
                ? `${cafes.length} ${cafes.length === 1 ? 'cafe' : 'cafes'} pouring near you.`
                : 'Order ahead — skip the line.'}
          </Text>
          {errorMsg && <Text style={styles.notice}>{errorMsg}</Text>}
        </View>

        <View style={styles.searchRow}>
          <TouchableOpacity
            style={styles.searchField}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/search')}
          >
            <Feather name="search" size={16} color={colors.inkMuted} />
            <Text style={styles.searchPlaceholder}>Search cafes or drinks…</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilterModal(true)}>
            <Feather name="sliders" size={18} color={colors.sage} />
          </TouchableOpacity>
        </View>

        <View style={styles.sect}>
          <Text style={styles.sectTitle}>Pouring now</Text>
          <TouchableOpacity onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}>
            <Text style={styles.sectLink}>{viewMode === 'list' ? 'Map' : 'List'}</Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'list' ? (
          <FlatList
            data={cafes}
            renderItem={renderCafeItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.mapWrap}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={location ? {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
              } : undefined}
              showsUserLocation
              showsMyLocationButton={false}
            >
              {cafes.map((cafe) => (
                <Marker
                  key={cafe.id}
                  coordinate={cafe.coordinates}
                  pinColor={cafe.isOpen ? colors.sage : colors.tabInactive}
                >
                  <Callout onPress={() => router.push(`/cafe/${cafe.id}`)}>
                    <View style={styles.calloutContainer}>
                      <Text style={styles.calloutTitle}>{cafe.name}</Text>
                      <Text style={styles.calloutAddress}>{cafe.address}</Text>
                      <View style={styles.calloutDetails}>
                        <View style={styles.calloutRating}>
                          <FontAwesome name="star" size={12} color={colors.gold} />
                          <Text style={styles.calloutRatingText}>{cafe.rating}</Text>
                        </View>
                        {cafe.distance != null && (
                          <Text style={styles.calloutDistance}>{cafe.distance}</Text>
                        )}
                        <Text style={cafe.isOpen ? styles.calloutOpen : styles.calloutClosed}>
                          {cafe.isOpen ? 'Open' : 'Closed'}
                        </Text>
                      </View>
                      <Text style={styles.calloutTapText}>Tap for details</Text>
                    </View>
                  </Callout>
                </Marker>
              ))}
            </MapView>
          </View>
        )}

        <Modal visible={showFilterModal} animationType="slide" transparent>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Filters</Text>

                <Text style={styles.modalLabel}>Max distance · miles</Text>
                <TextInput
                  value={maxDistance != null ? String(maxDistance) : ''}
                  onChangeText={(val) => {
                    const n = Number(val);
                    setMaxDistance(val.trim() === '' || Number.isNaN(n) ? null : n);
                  }}
                  keyboardType="numeric"
                  placeholder="Any"
                  placeholderTextColor={colors.inkMuted}
                  style={styles.modalInput}
                />

                <Text style={styles.modalLabel}>Sort by</Text>
                <View style={styles.chipRow}>
                  <TouchableOpacity
                    style={[styles.chip, sortBy === 'distance' && styles.chipOn]}
                    onPress={() => setSortBy('distance')}
                  >
                    <Text style={[styles.chipText, sortBy === 'distance' && styles.chipTextOn]}>Distance</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.chip, sortBy === 'rating' && styles.chipOn]}
                    onPress={() => setSortBy('rating')}
                  >
                    <Text style={[styles.chipText, sortBy === 'rating' && styles.chipTextOn]}>Rating</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalLabel}>Availability</Text>
                <View style={styles.chipRow}>
                  <TouchableOpacity
                    style={[styles.chip, !showOnlyOpen && styles.chipOn]}
                    onPress={() => setShowOnlyOpen(false)}
                  >
                    <Text style={[styles.chipText, !showOnlyOpen && styles.chipTextOn]}>All cafes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.chip, showOnlyOpen && styles.chipOn]}
                    onPress={() => setShowOnlyOpen(true)}
                  >
                    <Text style={[styles.chipText, showOnlyOpen && styles.chipTextOn]}>Open now</Text>
                  </TouchableOpacity>
                </View>

                <Pressable style={[primaryButton, styles.applyBtn]} onPress={() => setShowFilterModal(false)}>
                  <Text style={primaryButtonText}>Apply filters</Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
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
  greetDate: {
    ...overline(11),
    letterSpacing: 3,
  },
  greetTitle: {
    ...display(28),
    marginTop: 8,
  },
  greetSub: {
    fontFamily: fonts.light,
    fontSize: 14,
    letterSpacing: 0.3,
    color: colors.inkSoft,
    marginTop: 5,
  },
  notice: {
    fontFamily: fonts.light,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 6,
  },
  searchRow: {
    flexDirection: 'row',
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glassSoft,
    borderWidth: 1,
    borderColor: 'rgba(79,130,104,0.25)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  searchPlaceholder: {
    fontFamily: fonts.light,
    fontSize: 14,
    color: colors.inkMuted,
    marginLeft: 10,
  },
  filterBtn: {
    width: 46,
    height: 46,
    marginLeft: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1,
    borderColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sect: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 12,
  },
  sectTitle: {
    ...display(18),
    letterSpacing: 1.8,
  },
  sectLink: {
    ...overline(12),
    letterSpacing: 1.7,
  },
  listContainer: {
    paddingBottom: 24,
  },
  mapWrap: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: 16,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  calloutContainer: {
    width: 200,
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 12,
  },
  calloutTitle: {
    fontFamily: fonts.display,
    fontSize: 15,
    letterSpacing: 0.6,
    color: colors.ink,
    marginBottom: 4,
  },
  calloutAddress: {
    fontFamily: fonts.light,
    fontSize: 12,
    color: colors.inkSoft,
    marginBottom: 8,
  },
  calloutDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  calloutRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  calloutRatingText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.ink,
    marginLeft: 4,
  },
  calloutDistance: {
    fontFamily: fonts.light,
    fontSize: 12,
    color: colors.inkSoft,
    marginRight: 8,
  },
  calloutOpen: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.sage,
  },
  calloutClosed: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.inkMuted,
  },
  calloutTapText: {
    fontFamily: fonts.light,
    fontSize: 11.5,
    color: colors.sage,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(35,43,58,0.45)',
    padding: 20,
  },
  modalCard: {
    ...glassCard,
    backgroundColor: '#F4F2F9',
    padding: 22,
  },
  modalTitle: {
    ...display(21),
    marginBottom: 14,
  },
  modalLabel: {
    ...overline(10.5),
    color: colors.inkMuted,
    marginTop: 14,
    marginBottom: 8,
  },
  modalInput: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(79,130,104,0.25)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipRow: {
    flexDirection: 'row',
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
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
    fontSize: 11.5,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: colors.inkSoft,
  },
  chipTextOn: {
    color: colors.white,
    fontFamily: fonts.semibold,
  },
  applyBtn: {
    marginTop: 24,
  },
});
