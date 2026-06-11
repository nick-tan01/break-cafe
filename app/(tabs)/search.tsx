import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

import { supabase } from '../../lib/supabase';
import { getDistanceInMiles } from '../../lib/distance';
import CafeCard from '../../components/CafeCard';

interface Cafe {
  id: string;
  name: string;
  address: string;
  rating: number;
  image: string | null;
  isOpen: boolean;
  distance: number | null;
}

type FilterId = 'all' | 'open' | 'top';

const TOP_RATED_MIN = 4.5;

const FILTERS: { id: FilterId; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: 'th-large' },
  { id: 'open', label: 'Open Now', icon: 'clock-o' },
  { id: 'top', label: 'Top Rated', icon: 'star' },
];

const matchesFilter = (cafe: Cafe, filter: FilterId) => {
  if (filter === 'open') return cafe.isOpen;
  if (filter === 'top') return cafe.rating >= TOP_RATED_MIN;
  return true;
};

export default function SearchScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterId>('all');
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        // Location is optional here — if permission is denied we still show
        // results, just without distances.
        let coords: { latitude: number; longitude: number } | null = null;
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          }
        } catch (locationError) {
          console.error('Location error:', locationError);
        }

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
          setCafes([]);
        } else {
          const mapped: Cafe[] = (data ?? []).map((cafe) => {
            const lat = parseFloat(cafe.latitude);
            const lon = parseFloat(cafe.longitude);
            const distance = coords
              ? getDistanceInMiles(coords.latitude, coords.longitude, lat, lon)
              : null;
            const hours: { opening_time: string; closing_time: string; is_closed: boolean; day_of_week: number } | undefined = cafe.cafe_hours?.find((h: { opening_time: string; closing_time: string; is_closed: boolean; day_of_week: number }) => h.day_of_week === dayOfWeek);
            let isOpen = false;
            if (hours && !hours.is_closed) {
              isOpen = currentTime >= hours.opening_time && currentTime <= hours.closing_time;
            }
            return {
              id: String(cafe.cafe_id),
              name: cafe.name,
              address: cafe.address,
              rating: Number(cafe.avg_rating || 0),
              image: cafe.profile_image_url,
              isOpen,
              distance,
            };
          });

          if (coords) {
            mapped.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
          }
          setCafes(mapped);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const filteredCafes = cafes.filter((cafe) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' ||
      cafe.name.toLowerCase().includes(query) ||
      cafe.address.toLowerCase().includes(query);
    return matchesSearch && matchesFilter(cafe, selectedFilter);
  });

  const renderFilterTag = ({ item }: { item: typeof FILTERS[0] }) => (
    <TouchableOpacity
      style={[
        styles.filterTag,
        {
          backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#f2f2f7',
          borderWidth: 1,
          borderColor: colorScheme === 'dark' ? '#3c3c3e' : '#e5e5e5'
        },
        selectedFilter === item.id && {
          backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff',
          borderColor: '#007AFF'
        }
      ]}
      onPress={() => setSelectedFilter(item.id)}
    >
      <FontAwesome
        name={item.icon as any}
        size={16}
        color={selectedFilter === item.id
          ? '#007AFF'
          : colorScheme === 'dark' ? '#fff' : '#000'
        }
        style={styles.filterIcon}
      />
      <Text style={[
        styles.filterTagText,
        {
          color: selectedFilter === item.id
            ? '#007AFF'
            : colorScheme === 'dark' ? '#fff' : '#000'
        }
      ]}>
        {item.label} ({selectedFilter === item.id
          ? filteredCafes.length
          : cafes.filter(cafe => matchesFilter(cafe, item.id)).length})
      </Text>
    </TouchableOpacity>
  );

  const renderCafeItem = ({ item }: { item: Cafe }) => (
    <CafeCard
      name={item.name}
      address={item.address}
      rating={item.rating}
      isOpen={item.isOpen}
      image={item.image}
      distance={item.distance != null ? `${item.distance.toFixed(1)} mi` : null}
      onPress={() => router.push(`/cafe/${item.id}`)}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }]}>
      <View style={[
        styles.searchContainer,
        { backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#f5f5f5' }
      ]}>
        <FontAwesome
          name="search"
          size={18}
          color={colorScheme === 'dark' ? '#fff' : '#666'}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
          placeholder="Search cafes or addresses..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colorScheme === 'dark' ? '#999' : '#666'}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchQuery !== '' && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <FontAwesome
              name="times-circle"
              size={18}
              color={colorScheme === 'dark' ? '#fff' : '#666'}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterContainer}>
        <FlatList
          data={FILTERS}
          renderItem={renderFilterTag}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterList}
          contentContainerStyle={styles.filterListContent}
        />
      </View>

      {isLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.emptyStateSubtext}>Loading cafes...</Text>
        </View>
      ) : filteredCafes.length === 0 ? (
        <View style={styles.emptyState}>
          <FontAwesome name="search" size={48} color="#666" />
          <Text style={[styles.emptyStateText, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            No cafes found
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Try adjusting your search or filters
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCafes}
          renderItem={renderCafeItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.cafeList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#f5f5f5',
    margin: 16,
    borderRadius: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  filterContainer: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterList: {
    paddingVertical: 12,
  },
  filterListContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    minWidth: 100,
    justifyContent: 'center',
  },
  filterIcon: {
    marginRight: 8,
    width: 16,
    textAlign: 'center',
  },
  filterTagText: {
    fontSize: 15,
    fontWeight: '600',
  },
  cafeList: {
    padding: 16,
  },
  clearButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});
