import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { brandColors } from '../../config/brand';
import { AuthNotConfiguredError } from '../../data/auth';

/** Shows a submit error; while accounts aren't set up, offers a way into the app. */
export function FormNotice({ error }: { error: unknown }) {
  if (!error) return null;
  const notConfigured = error instanceof AuthNotConfiguredError;
  return (
    <View style={styles.box}>
      <Text style={styles.text}>{error instanceof Error ? error.message : String(error)}</Text>
      {notConfigured && (
        <Pressable onPress={() => router.replace('/map')} hitSlop={8}>
          <Text style={styles.link}>Continue to the map →</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: 'rgba(232,190,88,0.12)', borderRadius: 12, padding: 12, gap: 8 },
  text: { color: brandColors.white, fontSize: 14 },
  link: { color: brandColors.gold, fontSize: 15, fontWeight: '700' },
});
