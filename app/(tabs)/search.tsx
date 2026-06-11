import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import { supabase } from '../../lib/supabase';
import { getDistanceInMiles } from '../../lib/distance';
import { colors, fonts, display, overline } from '../../lib/theme';
import CafeCard from '../../components/CafeCard';
import GradientScreen from '../../components/GradientScreen';

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

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open now' },
  { id: 'top', label: 'Top rated' },
];

const matchesFilter = (cafe: Cafe, filter: FilterId) => {
  if (filter === 'open') return cafe.isOpen;
  if (filter === 'top') return cafe.rating >= TOP_RATED_MIN;
  return true;
};

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const renderFilterTag = ({ item }: { item: typeof FILTERS[0] }) => {
    const selected = selectedFilter === item.id;
    const count = selected
      ? filteredCafes.length
      : cafes.filter(cafe => matchesFilter(cafe, item.id)).length;
    return (
      <TouchableOpacity
        style={[styles.chip, selected && styles.chipOn]}
        onPress={() => setSelectedFilter(item.id)}
      >
        <Text style={[styles.chipText, selected && styles.chipTextOn]}>
          {item.label} ({count})
        </Text>
      </TouchableOpacity>
    );
  };

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
    <GradientScreen>
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <View style={styles.head}>
          <Text style={styles.kicker}>BREAK</Text>
          <Text style={styles.title}>Search</Text>
        </View>

        <View style={styles.searchField}>
          <Feather name="search" size={16} color={colors.inkMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cafes or addresses…"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.inkMuted}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery !== '' && (
            <TouchableOpacity style={styles.clearButton} onPress={() => setSearchQuery('')}>
              <Feather name="x-circle" size={16} color={colors.inkMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          <FlatList
            data={FILTERS}
            renderItem={renderFilterTag}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>

        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={colors.sage} />
            <Text style={[styles.emptySub, styles.loadingText]}>Loading cafes…</Text>
          </View>
        ) : filteredCafes.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="search" size={44} color={colors.inkMuted} />
            <Text style={styles.emptyTitle}>No cafes found</Text>
            <Text style={styles.emptySub}>Try adjusting your search or filters.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredCafes}
            renderItem={renderCafeItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 22,
  },
  head: {
    marginTop: 8,
    marginBottom: 18,
  },
  kicker: {
    ...overline(11),
    letterSpacing: 3,
  },
  title: {
    ...display(28),
    marginTop: 8,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glassSoft,
    borderWidth: 1,
    borderColor: 'rgba(79,130,104,0.25)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.light,
    fontSize: 14,
    color: colors.ink,
    marginLeft: 10,
    padding: 0,
  },
  clearButton: {
    paddingLeft: 8,
  },
  filterRow: {
    marginTop: 14,
    marginBottom: 12,
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
  listContainer: {
    paddingBottom: 24,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyTitle: {
    ...display(20),
    marginTop: 16,
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: fonts.light,
    fontSize: 14,
    letterSpacing: 0.3,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 14,
  },
});
