import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { theme } from '../../config/theme';

/** Stacked + / − buttons. */
export function ZoomControl({ onZoomIn, onZoomOut }: { onZoomIn: () => void; onZoomOut: () => void }) {
  return (
    <View style={styles.box}>
      <Pressable
        onPress={onZoomIn}
        accessibilityRole="button"
        accessibilityLabel="Zoom in"
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Ionicons name="add" size={26} color={theme.text} />
      </Pressable>
      <View style={styles.divider} />
      <Pressable
        onPress={onZoomOut}
        accessibilityRole="button"
        accessibilityLabel="Zoom out"
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Ionicons name="remove" size={26} color={theme.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    overflow: 'visible',
  },
  button: { height: 46, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.5 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#ccc', marginHorizontal: 8 },
});
