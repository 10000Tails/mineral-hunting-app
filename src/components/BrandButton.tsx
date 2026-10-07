import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { brandColors, brandFonts } from '../config/brand';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  style?: ViewStyle;
}

/** Gold, logo-matched button. Primary is solid gold; secondary is a gold outline on glass. */
export function BrandButton({ label, onPress, variant = 'primary', disabled, style }: Props) {
  const [scale] = useState(() => new Animated.Value(1));
  const pressTo = (v: number) =>
    Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 6 }).start();

  const text = (
    <Text style={[styles.label, variant === 'primary' ? styles.primaryLabel : styles.secondaryLabel]}>
      {label}
    </Text>
  );

  return (
    <Animated.View style={[{ transform: [{ scale }], opacity: disabled ? 0.5 : 1 }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        onPressIn={() => pressTo(0.96)}
        onPressOut={() => pressTo(1)}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          onPress();
        }}
      >
        {variant === 'primary' ? (
          <LinearGradient colors={brandColors.goldGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.base, styles.primary]}>
            {text}
          </LinearGradient>
        ) : (
          <View style={[styles.base, styles.secondary]}>{text}</View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  primary: {
    borderWidth: 1,
    borderColor: 'rgba(255,240,190,0.8)',
    shadowColor: '#E8A21C',
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  secondary: {
    borderWidth: 1.5,
    borderColor: brandColors.gold,
    backgroundColor: 'rgba(6,16,36,0.55)',
  },
  label: { fontFamily: brandFonts.bold, fontSize: 17, letterSpacing: 2 },
  primaryLabel: { color: brandColors.goldText },
  secondaryLabel: { color: brandColors.gold },
});
