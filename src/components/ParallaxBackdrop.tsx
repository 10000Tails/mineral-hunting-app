import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { brandImages } from '../config/brand';

interface Props {
  /** Smoothed tilt from useTiltParallax (-1…1 on each axis). */
  tilt: Animated.ValueXY;
  /** Extra zoom, e.g. for an intro push-in. Defaults to a fixed value. */
  scale?: Animated.Value | number;
  /** How far the background travels with tilt, in points. */
  travel?: number;
  /** Darken the whole image (0–1), for screens with forms on top. */
  dim?: number;
  onLoad?: () => void;
  children?: ReactNode;
}

/** Full-screen mountain artwork that drifts against the phone's tilt, with scrims for legibility. */
export function ParallaxBackdrop({ tilt, scale = 1.1, travel = 18, dim = 0, onLoad, children }: Props) {
  // The background moves opposite the tilt, so it reads as far away.
  const translateX = tilt.x.interpolate({ inputRange: [-1, 1], outputRange: [travel, -travel] });
  const translateY = tilt.y.interpolate({ inputRange: [-1, 1], outputRange: [-travel, travel] });

  return (
    <View style={styles.root}>
      <Animated.Image
        source={brandImages.welcomeBackground}
        resizeMode="cover"
        onLoad={onLoad}
        style={[StyleSheet.absoluteFill, { transform: [{ translateX }, { translateY }, { scale }] }]}
      />
      {dim > 0 && <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(2,10,24,${dim})` }]} />}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(2,12,30,0.45)', 'rgba(2,12,30,0)']}
        style={[styles.scrim, styles.top]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(2,10,24,0)', 'rgba(2,10,24,0.55)', 'rgba(2,10,24,0.9)']}
        style={[styles.scrim, styles.bottom]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#021F46', overflow: 'hidden' },
  scrim: { position: 'absolute', left: 0, right: 0 },
  top: { top: 0, height: '22%' },
  bottom: { bottom: 0, height: '45%' },
});
