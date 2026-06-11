import { StyleSheet, FlatList, View, Text, TouchableOpacity, Image, Alert, Dimensions, Platform, TextInput, TouchableWithoutFeedback, Keyboard, Modal, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import MapView, { Marker, Callout } from 'react-native-maps';
import React from 'react';

import { supabase } from '../../lib/supabase';

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
  distance: string;
  image: string;
  isOpen: boolean;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'distance' | 'rating'>('distance');
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [maxDistance, setMaxDistance] = useState(10);
  const mapRef = useRef<MapView>(null);

  const getDistanceInMiles = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3958.8;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 +
              Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
              Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          Alert.alert(
            'Location Permission Required',
            'Please enable location services to find cafes near you.',
            [{ text: 'OK' }]
          );
          setIsLoading(false);
          return;
        }

        let loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(loc);

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
            const distance = getDistanceInMiles(loc.coords.latitude, loc.coords.longitude, lat, lon);
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
              distance: `${distance.toFixed(1)} mi`,
              image: cafe.profile_image_url,
              isOpen,
              coordinates: { latitude: lat, longitude: lon },
              distanceRaw: distance
            };
          });

          if (showOnlyOpen) filtered = filtered.filter(c => c.isOpen);
          filtered = filtered.filter(c => c.distanceRaw! <= maxDistance);
          if (sortBy === 'rating') filtered.sort((a, b) => b.rating - a.rating);
          else filtered.sort((a, b) => a.distanceRaw! - b.distanceRaw!);

          setCafes(filtered);
        }
      } catch (error) {
        console.error('Location error:', error);
        setErrorMsg('Could not get location.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [maxDistance, sortBy, showOnlyOpen]);

  
  const calculateDistance = (cafe: Cafe) => {
    if (!location) return cafe.distance;
  
    const R = 3958.8; // Radius of Earth in miles
    const lat1 = location.coords.latitude * Math.PI / 180;
    const lat2 = cafe.coordinates.latitude * Math.PI / 180;
    const deltaLat = (cafe.coordinates.latitude - location.coords.latitude) * Math.PI / 180;
    const deltaLon = (cafe.coordinates.longitude - location.coords.longitude) * Math.PI / 180;
  
    const a = Math.sin(deltaLat / 2) ** 2 +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
  
    return distance < 1
      ? `${Math.round(distance * 5280)} ft`
      : `${distance.toFixed(1)} mi`;
  };

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
    <TouchableOpacity style={styles.cafeCard} onPress={() => router.push(`/cafe/${item.id}`)}>
      <Image source={{ uri: item.image }} style={styles.cafeImage} />
      <View style={styles.cafeInfo}>
        <Text style={[styles.cafeName, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>{item.name}</Text>
        <Text style={styles.cafeAddress}>{item.address}</Text>
        <View style={styles.cafeStats}>
          <View style={styles.ratingContainer}>
            <FontAwesome name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>{item.rating}</Text>
          </View>
          <Text style={styles.distance}>{item.distance}</Text>
          <View style={[styles.openStatus, { backgroundColor: item.isOpen ? '#4CAF50' : '#F44336' }]}>
            <Text style={styles.openStatusText}>{item.isOpen ? 'Open' : 'Closed'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }]}>
        <View style={styles.filtersContainer}>
          {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
            <FontAwesome name="filter" size={16} color="#007AFF" />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={showFilterModal} animationType="slide" transparent>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#000000aa' }}>
              <View style={{ backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 12 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Filters</Text>
                <Text>Max Distance (in miles):</Text>
                <TextInput
                  value={String(maxDistance)}
                  onChangeText={(val) => setMaxDistance(Number(val))}
                  keyboardType="numeric"
                  placeholder="10"
                  style={{ borderWidth: 1, padding: 8, borderRadius: 8, marginTop: 8, marginBottom: 16 }}
                />

                <Text style={{ marginTop: 16 }}>Sort By:</Text>
                <View style={{ flexDirection: 'row', marginTop: 8 }}>
                  <TouchableOpacity onPress={() => setSortBy('distance')} style={{ marginRight: 12 }}>
                    <Text style={{ color: sortBy === 'distance' ? '#007AFF' : '#000' }}>Distance</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setSortBy('rating')}>
                    <Text style={{ color: sortBy === 'rating' ? '#007AFF' : '#000' }}>Rating</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
                  <Text style={{ marginRight: 8 }}>Only show open cafes:</Text>
                  <TouchableOpacity onPress={() => setShowOnlyOpen(!showOnlyOpen)}>
                    <Text style={{ color: showOnlyOpen ? '#007AFF' : '#000' }}>{showOnlyOpen ? 'Yes' : 'No'}</Text>
                  </TouchableOpacity>
                </View>

                <Pressable style={{ marginTop: 24, backgroundColor: '#007AFF', padding: 12, borderRadius: 8 }} onPress={() => setShowFilterModal(false)}>
                  <Text style={{ color: '#fff', textAlign: 'center' }}>Apply Filters</Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <View style={styles.viewToggle}>
          <TouchableOpacity style={[styles.viewToggleButton, viewMode === 'list' && styles.viewToggleButtonActive]} onPress={() => setViewMode('list')}>
            <FontAwesome name="list" size={16} color={viewMode === 'list' ? '#fff' : '#007AFF'} />
            <Text style={[styles.viewToggleText, viewMode === 'list' && styles.viewToggleTextActive]}>List</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.viewToggleButton, viewMode === 'map' && styles.viewToggleButtonActive]} onPress={() => setViewMode('map')}>
            <FontAwesome name="map" size={16} color={viewMode === 'map' ? '#fff' : '#007AFF'} />
            <Text style={[styles.viewToggleText, viewMode === 'map' && styles.viewToggleTextActive]}>Map</Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'list' ? (
          <FlatList
            data={cafes}
            renderItem={renderCafeItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
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
                pinColor={cafe.isOpen ? "#4CAF50" : "#F44336"}
              >
                <Callout onPress={() => router.push(`/cafe/${cafe.id}`)}>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>{cafe.name}</Text>
                    <Text style={styles.calloutAddress}>{cafe.address}</Text>
                    <View style={styles.calloutDetails}>
                      <View style={styles.calloutRating}>
                        <FontAwesome name="star" size={12} color="#FFD700" />
                        <Text style={styles.calloutRatingText}>{cafe.rating}</Text>
                      </View>
                      <Text style={styles.calloutDistance}>{cafe.distance}</Text>
                      <View style={[styles.calloutStatus, { backgroundColor: cafe.isOpen ? '#4CAF50' : '#F44336' }]}>
                        <Text style={styles.calloutStatusText}>{cafe.isOpen ? 'Open' : 'Closed'}</Text>
                      </View>
                    </View>
                    <Text style={styles.calloutTapText}>Tap for details</Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    marginRight: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
  },
  filterButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  viewToggle: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 4,
  },
  viewToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
  },
  viewToggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  viewToggleText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  viewToggleTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  cafeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
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
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapButtonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  myLocationButton: {
    backgroundColor: '#fff',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutContainer: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  calloutAddress: {
    fontSize: 12,
    color: '#666',
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
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  calloutDistance: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  calloutStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  calloutStatusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  calloutTapText: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
