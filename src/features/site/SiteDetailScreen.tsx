import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { commodityName, groupForCodes } from '../../config/commodities';
import { theme } from '../../config/theme';
import { getCachedSite } from '../../data/sites';
import { bearingDegrees, compassPoint, distanceMeters, formatDistance } from '../../lib/geo';
import { useUserLocation } from '../../state/useUserLocation';

export default function SiteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const site = id ? getCachedSite(decodeURIComponent(id)) : undefined;
  const { location } = useUserLocation(!!site, 25);

  if (!site) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>This site isn't loaded. Go back to the map and tap it again.</Text>
      </View>
    );
  }

  const group = groupForCodes(site.commodityCodes);
  const away = location
    ? `${formatDistance(distanceMeters(location, site))} ${compassPoint(bearingDegrees(location, site))}`
    : null;

  const openDirections = () => {
    const { latitude: lat, longitude: lon } = site;
    const url = Platform.OS === 'ios'
      ? `maps://?daddr=${lat},${lon}&q=${encodeURIComponent(site.name)}`
      : `geo:${lat},${lon}?q=${lat},${lon}(${encodeURIComponent(site.name)})`;
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`)
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: site.name }} />

      <View style={styles.headerRow}>
        <View style={[styles.swatch, { backgroundColor: group.color }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{site.name}</Text>
          <Text style={styles.muted}>{group.label} · {site.devStatus}</Text>
        </View>
      </View>

      {away && <Text style={styles.away}>{away} from you</Text>}

      <Text style={styles.section}>Commodities</Text>
      <View style={styles.tags}>
        {site.commodityCodes.length === 0 && <Text style={styles.muted}>None listed</Text>}
        {site.commodityCodes.map((c) => (
          <View key={c} style={styles.tag}>
            <Text style={styles.tagText}>{commodityName(c)}</Text>
            {commodityName(c) !== c && <Text style={styles.tagCode}> {c}</Text>}
          </View>
        ))}
      </View>

      <Text style={styles.section}>Location</Text>
      <Text style={styles.body} selectable>
        {site.latitude.toFixed(5)}, {site.longitude.toFixed(5)}
      </Text>

      <Pressable style={styles.button} onPress={openDirections}>
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
        Many sites are on private land or are old workings with open shafts and unstable ground. Get the
        landowner's permission and never enter mine openings.
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
  away: { marginTop: 12, fontSize: 16, fontWeight: '600', color: theme.accent },
  section: { fontSize: 13, fontWeight: '700', color: theme.muted, textTransform: 'uppercase', marginTop: 24, marginBottom: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { flexDirection: 'row', backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { color: theme.text, fontSize: 14 },
  tagCode: { color: theme.muted, fontSize: 12, alignSelf: 'center' },
  body: { fontSize: 16, color: theme.text },
  button: { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.accent, borderRadius: 12, paddingVertical: 14 },
  secondary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.accent, marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  note: { marginTop: 28, fontSize: 13, color: theme.muted, lineHeight: 18 },
});
