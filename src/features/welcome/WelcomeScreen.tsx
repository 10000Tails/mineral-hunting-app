import { router, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandButton } from '../../components/BrandButton';
import { ParallaxBackdrop } from '../../components/ParallaxBackdrop';
import { brandImages, LOGO_ASPECT } from '../../config/brand';
import { useTiltParallax } from '../../state/useTiltParallax';

/** Delay before the branding appears, so the landscape gets a moment on its own. */
const REVEAL_DELAY_MS = 600;
const REVEAL_DURATION_MS = 1000;

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const focused = useIsFocused();
  const tilt = useTiltParallax(focused);

  const [reveal] = useState(() => new Animated.Value(0));
  const [zoom] = useState(() => new Animated.Value(1.16));

  useEffect(() => {
    // Slow push-in on the landscape, then logo and buttons fade up together.
    Animated.timing(zoom, {
      toValue: 1.1,
      duration: 2600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    Animated.timing(reveal, {
      toValue: 1,
      delay: REVEAL_DELAY_MS,
      duration: REVEAL_DURATION_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [reveal, zoom]);

  const fadeUp = {
    opacity: reveal,
    transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
  };

  // The logo moves with the tilt (opposite the background), so it floats in front of the mountains.
  const logoShift = {
    transform: [
      { translateX: tilt.x.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] }) },
      { translateY: tilt.y.interpolate({ inputRange: [-1, 1], outputRange: [8, -8] }) },
    ],
  };

  const logoWidth = Math.min(width * 0.72, 340);
  const logoHeight = logoWidth / LOGO_ASPECT;

  return (
    <ParallaxBackdrop tilt={tilt} scale={zoom}>
      <StatusBar style="light" />

      <View style={[styles.logoArea, { paddingTop: insets.top + height * 0.06 }]} pointerEvents="none">
        <Animated.View style={fadeUp}>
          <Animated.View style={logoShift}>
            <Animated.Image
              source={brandImages.logo}
              resizeMode="contain"
              accessibilityRole="image"
              accessibilityLabel="Mineral Hunter"
              style={{ width: logoWidth, height: logoHeight }}
            />
          </Animated.View>
        </Animated.View>
      </View>

      <Animated.View style={[styles.buttons, { paddingBottom: insets.bottom + 28 }, fadeUp]}>
        <BrandButton label="Create Account" onPress={() => router.push('/create-account')} />
        <BrandButton label="Log In" variant="secondary" onPress={() => router.push('/log-in')} />
      </Animated.View>
    </ParallaxBackdrop>
  );
}

const styles = StyleSheet.create({
  logoArea: { flex: 1, alignItems: 'center' },
  buttons: { position: 'absolute', left: 24, right: 24, bottom: 0, gap: 14 },
});
