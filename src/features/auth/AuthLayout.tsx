import { router, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ParallaxBackdrop } from '../../components/ParallaxBackdrop';
import { brandColors, brandFonts, brandImages, LOGO_ASPECT } from '../../config/brand';
import { useTiltParallax } from '../../state/useTiltParallax';

interface Props {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Shared frame for the account screens: dimmed parallax landscape, small logo, glass card. */
export function AuthLayout({ title, children, footer }: Props) {
  const insets = useSafeAreaInsets();
  const tilt = useTiltParallax(useIsFocused());

  return (
    <ParallaxBackdrop tilt={tilt} dim={0.45}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back} accessibilityLabel="Back">
            <Text style={styles.backText}>‹ Back</Text>
          </Pressable>

          <Image source={brandImages.logo} resizeMode="contain" style={styles.logo} accessibilityLabel="Mineral Hunter" />

          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            {children}
          </View>

          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
    </ParallaxBackdrop>
  );
}

const LOGO_HEIGHT = 150;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24 },
  back: { alignSelf: 'flex-start', paddingVertical: 4 },
  backText: { color: brandColors.mist, fontSize: 17 },
  logo: { alignSelf: 'center', height: LOGO_HEIGHT, width: LOGO_HEIGHT * LOGO_ASPECT, marginTop: 4, marginBottom: 20 },
  card: {
    backgroundColor: 'rgba(6,16,36,0.72)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(232,190,88,0.35)',
    padding: 20,
    gap: 14,
  },
  title: { fontFamily: brandFonts.bold, fontSize: 22, letterSpacing: 1.5, color: brandColors.gold, textAlign: 'center', marginBottom: 4 },
});
