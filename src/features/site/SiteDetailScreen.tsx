import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FavoriteButton } from '../../components/FavoriteButton';
import { SiteInfo } from '../../components/SiteInfo';
import { commodityName, groupForCodes } from '../../config/commodities';
import { theme } from '../../config/theme';
import { getCachedSite } from '../../data/sites';
import { openDirections } from '../../lib/directions';
import { bearingDegrees, compassPoint, distanceMeters, formatDistance } from '../../lib/geo';
import { useFavorites } from '../../state/favorites';
import { useUserLocation } from '../../state/useUserLocation';

export default function SiteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getFavorite } = useFavorites();
  const siteId = id ? decodeURIComponent(id) : undefined;
  // Sites loaded on the map are cached; saved favorites are on the phone even after a restart.
  const site = siteId ? (getCachedSite(siteId) ?? getFavorite(siteId)) : undefined;
  const { location } = useUserLocation(!!site, 25);

  if (!site) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>{"This site isn't loaded. Go back to the map and tap it again."}</Text>
      </View>
    );
  }

  const group = groupForCodes(site.commodityCodes);
  const away = location
    ? `${formatDistance(distanceMeters(location, site))} ${compassPoint(bearingDegrees(location, site))}`
    : null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: site.name }} />

      <View style={styles.headerRow}>
        <View style={[styles.swatch, { backgroundColor: group.color }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{site.name}</Text>
          <Text style={styles.muted}>
            {group.label} · {site.devStatus}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        {away ? <Text style={styles.away}>{away} from you</Text> : <View />}
        <FavoriteButton site={site} withLabel />
      </View>

      <View style={styles.tags}>
        {site.commodityCodes.map((c) => (
          <View key={c} style={styles.tag}>
            <Text style={styles.tagText}>{commodityName(c)}</Text>
            {commodityName(c) !== c && <Text style={styles.tagCode}> {c}</Text>}
          </View>
        ))}
      </View>

      <SiteInfo site={site} />

      <Pressable style={styles.button} onPress={() => openDirections(site.latitude, site.longitude, site.name)}>
        <Ionicons name="navigate" size={18} color="#fff" />
        <Text style={styles.buttonText}>Directions</Text>
      </Pressable>
      {site.url && (
        <Pressable style={[styles.button, styles.secondary]} onPress={() => WebBrowser.openBrowserAsync(site.url!)}>
          <Ionicons name="document-text" size={18} color={theme.accent} />
          <Text style={[styles.buttonText, { color: theme.accent }]}>Full USGS record</Text>
        </Pressable>
      )}

      <Text style={styles.note}>
        {'Many sites are on private land or are old workings with open shafts and unstable ground. ' +
          "Get the landowner's permission and never enter mine openings."}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  content: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  swatch: { width: 18, height: 18, borderRadius: 9 },
  title: { fontSize: 22, fontWeight: '700', color: theme.text },
  muted: { color: theme.muted, fontSize: 14 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  away: { fontSize: 16, fontWeight: '600', color: theme.accent },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  tag: { flexDirection: 'row', backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { color: theme.text, fontSize: 14 },
  tagCode: { color: theme.muted, fontSize: 12, alignSelf: 'center' },
  button: { marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.accent, borderRadius: 12, paddingVertical: 14 },
  secondary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.accent, marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  note: { marginTop: 28, fontSize: 13, color: theme.muted, lineHeight: 18 },
});
