import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { FavoriteButton } from '../../components/FavoriteButton';
import { SiteInfo } from '../../components/SiteInfo';
import { groupForCodes } from '../../config/commodities';
import { theme } from '../../config/theme';
import type { MineralSite } from '../../data/types';
import { openDirections } from '../../lib/directions';
import { distanceMeters, formatDistance, type LatLon } from '../../lib/geo';

interface Props {
  site: MineralSite;
  userLocation: LatLon | null;
  onClose: () => void;
}

/** The pop-up shown when a pin is tapped. */
export function SiteCard({ site, userLocation, onClose }: Props) {
  const { height } = useWindowDimensions();
  const [slide] = useState(() => new Animated.Value(0));
  const group = groupForCodes(site.commodityCodes);

  useEffect(() => {
    slide.setValue(0);
    Animated.timing(slide, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [site.id, slide]);

  const away = userLocation ? formatDistance(distanceMeters(userLocation, site)) : null;

  return (
    <Animated.View
      style={[
        styles.card,
        { maxHeight: height * 0.5 },
        {
          opacity: slide,
          transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: group.color }]} />
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={2}>
            {site.name}
          </Text>
          <Text style={styles.subtitle}>
            {group.label}
            {away ? ` · ${away} away` : ''}
          </Text>
        </View>
        <FavoriteButton site={site} />
        <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close" style={styles.close}>
          <Ionicons name="close" size={22} color={theme.muted} />
        </Pressable>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator>
        <SiteInfo site={site} />
      </ScrollView>

      <View style={styles.actions}>
        <Pressable
          style={[styles.action, styles.primary]}
          onPress={() => openDirections(site.latitude, site.longitude, site.name)}
        >
          <Ionicons name="navigate" size={16} color="#fff" />
          <Text style={styles.primaryText}>Directions</Text>
        </Pressable>
        <Pressable
          style={[styles.action, styles.secondary]}
          onPress={() => router.push(`/site/${encodeURIComponent(site.id)}`)}
        >
          <Text style={styles.secondaryText}>Full details</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.accent} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    backgroundColor: theme.card,
    borderRadius: 18,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dot: { width: 14, height: 14, borderRadius: 7, marginTop: 5 },
  titleBlock: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700', color: theme.text },
  subtitle: { fontSize: 13, color: theme.muted, marginTop: 2 },
  close: { padding: 4 },
  body: { flexGrow: 0, flexShrink: 1 },
  bodyContent: { paddingBottom: 6 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 11,
  },
  primary: { backgroundColor: theme.accent },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  secondary: { borderWidth: 1.5, borderColor: theme.accent },
  secondaryText: { color: theme.accent, fontSize: 15, fontWeight: '600' },
});
