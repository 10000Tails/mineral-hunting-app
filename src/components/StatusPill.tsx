import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../config/theme';

interface Props {
  loading?: boolean;
  message: string;
  tone?: 'normal' | 'error';
  onPress?: () => void;
}

export function StatusPill({ loading, message, tone = 'normal', onPress }: Props) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[styles.pill, tone === 'error' && styles.error]}>
      <View style={styles.row}>
        {loading && <ActivityIndicator size="small" color={theme.accent} style={styles.spinner} />}
        <Text style={[styles.text, tone === 'error' && styles.errorText]} numberOfLines={3}>
          {message}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  error: { backgroundColor: '#FFF0F0' },
  row: { flexDirection: 'row', alignItems: 'center' },
  spinner: { marginRight: 8 },
  text: { color: theme.text, fontSize: 13, flexShrink: 1 },
  errorText: { color: theme.danger },
});
