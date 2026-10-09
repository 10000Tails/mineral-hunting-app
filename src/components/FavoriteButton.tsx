import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text } from 'react-native';

import { theme } from '../config/theme';
import type { MineralSite } from '../data/types';
import { useFavorites } from '../state/favorites';

const RED = '#E03131';

/** Heart toggle. `withLabel` adds "Save" / "Saved" text for wider layouts. */
export function FavoriteButton({ site, withLabel = false }: { site: MineralSite; withLabel?: boolean }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const saved = isFavorite(site.id);

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        toggleFavorite(site);
      }}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={saved ? 'Remove from favorites' : 'Add to favorites'}
      accessibilityState={{ selected: saved }}
      style={({ pressed }) => [styles.button, withLabel && styles.labeled, saved && withLabel && styles.savedBg, pressed && styles.pressed]}
    >
      <Ionicons name={saved ? 'heart' : 'heart-outline'} size={withLabel ? 20 : 26} color={saved ? RED : theme.muted} />
      {withLabel && <Text style={[styles.label, saved && { color: RED }]}>{saved ? 'Saved' : 'Save'}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 4 },
  labeled: {
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
  },
  savedBg: { borderColor: '#FFC9C9', backgroundColor: '#FFF5F5' },
  label: { fontSize: 15, fontWeight: '600', color: theme.text },
  pressed: { opacity: 0.6 },
});
