import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { commodityName, groupForCodes } from '../../config/commodities';
import { theme } from '../../config/theme';
import type { MineralSite } from '../../data/types';
import { distanceMeters, formatDistance } from '../../lib/geo';
import { useFavorites, type Favorite } from '../../state/favorites';
import { useUserLocation } from '../../state/useUserLocation';

/** Bumped on every "show on map" so tapping the same favorite twice still re-centers the map. */
let focusRequest = 0;

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const { favorites, ready, removeFavorite } = useFavorites();
  const { location } = useUserLocation(favorites.length > 0, 100);

  const showOnMap = (site: MineralSite) =>
    router.navigate({ pathname: '/map', params: { focus: site.id, at: String(++focusRequest) } });

  const confirmRemove = (site: MineralSite) =>
    Alert.alert('Remove from Favorites?', site.name, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFavorite(site.id) },
    ]);

  const renderItem = ({ item }: { item: Favorite }) => {
    const { site } = item;
    const group = groupForCodes(site.commodityCodes);
    const commodities = site.commodityCodes.slice(0, 3).map(commodityName).join(', ') || 'No commodity listed';
    return (
      <Pressable
        onPress={() => showOnMap(site)}
        onLongPress={() => confirmRemove(site)}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        accessibilityHint="Shows this site on the map"
      >
        <View style={[styles.dot, { backgroundColor: group.color }]} />
        <View style={styles.rowText}>
          <Text style={styles.name} numberOfLines={1}>
            {site.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {site.devStatus} · {commodities}
          </Text>
          {location && <Text style={styles.distance}>{formatDistance(distanceMeters(location, site))} away</Text>}
        </View>
        <Pressable onPress={() => confirmRemove(site)} hitSlop={10} accessibilityLabel={`Remove ${site.name} from favorites`}>
          <Ionicons name="heart" size={22} color="#E03131" />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Favorites</Text>
      {ready && favorites.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={48} color={theme.border} />
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptyBody}>Tap a pin on the map, then tap the heart to save the site here.</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(f) => f.site.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListFooterComponent={
            favorites.length > 0 ? (
              <Text style={styles.hint}>Tap a site to see it on the map. Tap the heart to remove it.</Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  title: { fontSize: 30, fontWeight: '800', color: theme.text, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
  },
  pressed: { opacity: 0.7 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  rowText: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: theme.text },
  meta: { fontSize: 13, color: theme.muted, marginTop: 2 },
  distance: { fontSize: 13, color: theme.accent, fontWeight: '600', marginTop: 2 },
  separator: { height: 10 },
  hint: { fontSize: 12, color: theme.muted, textAlign: 'center', marginTop: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
  emptyBody: { fontSize: 15, color: theme.muted, textAlign: 'center', lineHeight: 21 },
});
