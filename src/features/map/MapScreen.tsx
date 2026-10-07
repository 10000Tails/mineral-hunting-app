import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type MapType, type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RoundButton } from '../../components/RoundButton';
import { StatusPill } from '../../components/StatusPill';
import { COMMODITY_GROUPS, commodityName, groupForCodes } from '../../config/commodities';
import type { BBox } from '../../data/types';
import { useFilters } from '../../state/filters';
import { useSitesInArea } from '../../state/useSitesInArea';
import { useUserLocation } from '../../state/useUserLocation';

/** Above this span (degrees of latitude) we don't load sites — there would be far too many. */
const MAX_LOAD_SPAN = 1.5;
const SITE_LIMIT = 500;
const MAP_TYPES: MapType[] = ['standard', 'hybrid', 'satellite'];

const CONTINENTAL_US: Region = { latitude: 39.5, longitude: -98.35, latitudeDelta: 30, longitudeDelta: 30 };

function regionToBBox(r: Region): BBox {
  return {
    minLat: r.latitude - r.latitudeDelta / 2,
    maxLat: r.latitude + r.latitudeDelta / 2,
    minLon: r.longitude - r.longitudeDelta / 2,
    maxLon: r.longitude + r.longitudeDelta / 2,
  };
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [mapType, setMapType] = useState<MapType>('standard');
  const { location, permission } = useUserLocation(true, 50);
  const filters = useFilters();
  const centeredOnUser = useRef(false);

  // Jump to the user the first time we get a fix.
  useEffect(() => {
    if (location && !centeredOnUser.current) {
      centeredOnUser.current = true;
      mapRef.current?.animateToRegion(
        { ...location, latitudeDelta: 0.2, longitudeDelta: 0.2 },
        800
      );
    }
  }, [location]);

  const tooFarOut = !region || region.latitudeDelta > MAX_LOAD_SPAN;
  const bbox = useMemo(() => (region && !tooFarOut ? regionToBBox(region) : null), [region, tooFarOut]);
  const { sites, loading, error, reload } = useSitesInArea(bbox, SITE_LIMIT);
  const visible = useMemo(() => (tooFarOut ? [] : sites.filter(filters.matches)), [sites, filters, tooFarOut]);

  let status = '';
  if (tooFarOut) status = 'Zoom in to load mine and mineral sites';
  else if (loading) status = 'Loading USGS sites…';
  else if (error) status = `${error}\nTap to retry.`;
  else if (sites.length >= SITE_LIMIT) status = `Showing ${visible.length} of the first ${SITE_LIMIT} sites — zoom in for more`;
  else status = `${visible.length} of ${sites.length} sites shown`;

  const goToUser = () => {
    if (location) {
      mapRef.current?.animateToRegion({ ...location, latitudeDelta: 0.1, longitudeDelta: 0.1 }, 600);
    }
  };

  const cycleMapType = () => setMapType((t) => MAP_TYPES[(MAP_TYPES.indexOf(t) + 1) % MAP_TYPES.length]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={CONTINENTAL_US}
        mapType={mapType}
        showsUserLocation={permission === 'granted'}
        showsCompass
        showsScale
        onRegionChangeComplete={setRegion}
      >
        {visible.map((site) => {
          const group = groupForCodes(site.commodityCodes);
          return (
            <Marker
              key={site.id}
              coordinate={{ latitude: site.latitude, longitude: site.longitude }}
              pinColor={group.color}
              title={site.name}
              description={`${site.devStatus} · ${site.commodityCodes.slice(0, 3).map(commodityName).join(', ') || 'No commodity listed'}`}
              onCalloutPress={() => router.push(`/site/${encodeURIComponent(site.id)}`)}
            />
          );
        })}
      </MapView>

      <View style={[styles.top, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <StatusPill
          loading={loading && !tooFarOut}
          message={status}
          tone={error && !tooFarOut ? 'error' : 'normal'}
          onPress={error ? reload : undefined}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.legend}>
          {COMMODITY_GROUPS.map((g) => {
            const on = filters.groups.has(g.key);
            return (
              <Pressable key={g.key} onPress={() => filters.toggleGroup(g.key)} style={[styles.chip, !on && styles.chipOff]}>
                <View style={[styles.dot, { backgroundColor: on ? g.color : '#CCC' }]} />
                <Text style={[styles.chipText, !on && styles.chipTextOff]}>{g.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={[styles.buttons, { bottom: 16 }]}>
        <RoundButton icon="options" label="Filters" badge={filters.activeCount} onPress={() => router.push('/filters')} />
        <RoundButton icon="layers" label="Map type" onPress={cycleMapType} />
        {permission === 'granted' && <RoundButton icon="locate" label="My location" onPress={goToUser} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  top: { position: 'absolute', left: 12, right: 12, gap: 8 },
  legend: { gap: 6, paddingRight: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipOff: { backgroundColor: 'rgba(255,255,255,0.7)' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  chipText: { fontSize: 12, fontWeight: '600', color: '#222' },
  chipTextOff: { color: '#888', textDecorationLine: 'line-through' },
  buttons: { position: 'absolute', right: 12, gap: 10 },
});
