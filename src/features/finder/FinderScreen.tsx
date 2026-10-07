import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useIsFocused } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../../config/theme';
import { bboxAround, compassPoint, distanceMeters, formatDistance, type LatLon } from '../../lib/geo';
import { useFilters } from '../../state/filters';
import { useHeading } from '../../state/useHeading';
import { useSitesInArea } from '../../state/useSitesInArea';
import { useUserLocation } from '../../state/useUserLocation';
import { Radar } from './Radar';
import { buildTargets, placeTags } from './targets';

/** Approximate horizontal field of view of the iPhone main camera held upright. */
const FOV_DEGREES = 52;
const RANGES_MILES = [1, 5, 10];
const MILE = 1609.344;
/** Re-download sites after walking this far from where we last loaded them. */
const RELOAD_AFTER_METERS = 1000;

export default function FinderScreen() {
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [camPermission, requestCam] = useCameraPermissions();
  const { location, permission: locPermission } = useUserLocation(focused, 10);
  const { heading, accuracy } = useHeading(focused);
  const filters = useFilters();
  const [rangeMiles, setRangeMiles] = useState(5);
  const radius = rangeMiles * MILE;

  // Only re-anchor the download area after moving a meaningful distance.
  const [anchor, setAnchor] = useState<LatLon | null>(null);
  if (location && (!anchor || distanceMeters(anchor, location) > RELOAD_AFTER_METERS)) {
    setAnchor({ latitude: location.latitude, longitude: location.longitude });
  }
  const loadRadius = Math.max(...RANGES_MILES) * MILE + RELOAD_AFTER_METERS;
  const bbox = useMemo(() => (anchor && focused ? bboxAround(anchor, loadRadius) : null), [anchor, focused, loadRadius]);
  const { sites, loading, error, reload } = useSitesInArea(bbox, 1000);

  const targets = useMemo(
    () => (location && heading != null ? buildTargets(sites.filter(filters.matches), location, heading, radius) : []),
    [sites, filters, location, heading, radius]
  );
  const tags = useMemo(() => placeTags(targets, FOV_DEGREES, width, height, radius), [targets, width, height, radius]);
  const nearest = targets[0];

  if (!camPermission || locPermission === 'checking') {
    return <View style={styles.black} />;
  }
  if (!camPermission.granted || locPermission === 'denied') {
    const needCam = !camPermission.granted;
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Ionicons name={needCam ? 'camera' : 'location'} size={48} color={theme.accent} />
        <Text style={styles.permTitle}>{needCam ? 'Camera access needed' : 'Location access needed'}</Text>
        <Text style={styles.permBody}>
          The finder overlays nearby mine and mineral sites on your camera view, using your location and compass.
        </Text>
        <Pressable
          style={styles.permButton}
          onPress={() => (needCam && camPermission.canAskAgain ? requestCam() : Linking.openSettings())}
        >
          <Text style={styles.permButtonText}>{needCam && camPermission.canAskAgain ? 'Allow camera' : 'Open Settings'}</Text>
        </Pressable>
      </View>
    );
  }

  let status: string | null = null;
  if (!location) status = 'Getting your location…';
  else if (heading == null) status = 'Waiting for compass…';
  else if (loading && sites.length === 0) status = 'Loading nearby sites…';
  else if (error) status = 'Couldn\'t load sites. Tap to retry.';
  else if (targets.length === 0) status = `No matching sites within ${rangeMiles} mi`;

  const offscreen = nearest && Math.abs(nearest.relative) > FOV_DEGREES / 2 ? nearest : null;

  return (
    <View style={styles.black}>
      {focused && <CameraView style={StyleSheet.absoluteFill} facing="back" />}

      {tags.map(({ target, x, y }) => (
        <Pressable
          key={target.site.id}
          onPress={() => router.push(`/site/${encodeURIComponent(target.site.id)}`)}
          style={[styles.tag, { left: x - 75, top: y, borderLeftColor: target.color }]}
        >
          <Text style={styles.tagName} numberOfLines={1}>{target.site.name}</Text>
          <Text style={styles.tagMeta}>{formatDistance(target.distance)} · {target.site.devStatus}</Text>
        </Pressable>
      ))}

      {offscreen && (
        <View style={[styles.edgeHint, offscreen.relative < 0 ? { left: 8 } : { right: 8 }, { top: height * 0.4 }]}>
          <Ionicons name={offscreen.relative < 0 ? 'arrow-back' : 'arrow-forward'} size={22} color="#fff" />
          <Text style={styles.edgeText}>Nearest</Text>
        </View>
      )}

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.ranges}>
          {RANGES_MILES.map((r) => (
            <Pressable key={r} onPress={() => setRangeMiles(r)} style={[styles.range, r === rangeMiles && styles.rangeOn]}>
              <Text style={[styles.rangeText, r === rangeMiles && styles.rangeTextOn]}>{r} mi</Text>
            </Pressable>
          ))}
        </View>
        {heading != null && (
          <Text style={styles.heading}>{Math.round(heading)}° {compassPoint(heading)}</Text>
        )}
      </View>

      {status && (
        <Pressable onPress={error ? reload : undefined} style={[styles.status, { top: insets.top + 56 }]}>
          <Text style={styles.statusText}>{status}</Text>
        </Pressable>
      )}
      {heading != null && accuracy < 2 && (
        <View style={[styles.status, { top: insets.top + (status ? 96 : 56) }]}>
          <Text style={styles.statusText}>Compass is imprecise — wave your phone in a figure 8</Text>
        </View>
      )}

      <View style={styles.bottom}>
        <Radar targets={targets} radiusMeters={radius} fovDegrees={FOV_DEGREES} />
        {nearest && (
          <Pressable
            style={styles.nearest}
            onPress={() => router.push(`/site/${encodeURIComponent(nearest.site.id)}`)}
          >
            <Text style={styles.nearestLabel}>NEAREST</Text>
            <Text style={styles.nearestName} numberOfLines={2}>{nearest.site.name}</Text>
            <Text style={styles.nearestMeta}>
              {formatDistance(nearest.distance)} {compassPoint(nearest.bearing)} · {targets.length} in range
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  black: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: theme.background },
  permTitle: { fontSize: 20, fontWeight: '700', marginTop: 16, color: theme.text },
  permBody: { fontSize: 15, color: theme.muted, textAlign: 'center', marginTop: 8, lineHeight: 21 },
  permButton: { marginTop: 24, backgroundColor: theme.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  permButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  tag: {
    position: 'absolute',
    width: 150,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderLeftWidth: 5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  tagName: { color: '#fff', fontWeight: '700', fontSize: 13 },
  tagMeta: { color: '#ddd', fontSize: 11, marginTop: 1 },
  edgeHint: { position: 'absolute', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, padding: 6 },
  edgeText: { color: '#fff', fontSize: 10, marginTop: 2 },
  topBar: { position: 'absolute', left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ranges: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 16, padding: 3 },
  range: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 13 },
  rangeOn: { backgroundColor: '#fff' },
  rangeText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  rangeTextOn: { color: '#000' },
  heading: { color: '#fff', fontWeight: '700', fontSize: 16, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, overflow: 'hidden' },
  status: { position: 'absolute', alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, maxWidth: '90%' },
  statusText: { color: '#fff', fontSize: 13, textAlign: 'center' },
  bottom: { position: 'absolute', left: 12, right: 12, bottom: 12, flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  nearest: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 14, padding: 12 },
  nearestLabel: { color: '#bbb', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  nearestName: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 2 },
  nearestMeta: { color: '#ddd', fontSize: 13, marginTop: 2 },
});
