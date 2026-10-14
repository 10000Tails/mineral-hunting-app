import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SignInButtons } from '../../components/SignInButtons';
import { theme } from '../../config/theme';
import { describeAuthError, useAuth } from '../../state/auth';
import { useFavorites } from '../../state/favorites';

const PROVIDER_LABEL = { apple: 'Apple', google: 'Google' } as const;

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut, deleteAccount } = useAuth();
  const { favorites } = useFavorites();
  const [busy, setBusy] = useState<'signout' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const doSignOut = async () => {
    setBusy('signout');
    setError(null);
    try {
      await signOut();
    } catch (e) {
      setError(describeAuthError(e));
    } finally {
      setBusy(null);
    }
  };

  const doDelete = async () => {
    setBusy('delete');
    setError(null);
    try {
      if (await deleteAccount()) router.replace('/');
    } catch (e) {
      setError(describeAuthError(e));
    } finally {
      setBusy(null);
    }
  };

  const confirmDelete = () =>
    Alert.alert(
      'Delete your account?',
      `This permanently deletes your Mineral Hunter account and the favorites saved to it. ` +
        `You'll be asked to confirm with ${user?.provider ? PROVIDER_LABEL[user.provider] : 'your sign-in'} first. ` +
        'Favorites already on this phone stay on this phone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Account', style: 'destructive', onPress: doDelete },
      ]
    );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
    >
      <Text style={styles.title}>Account</Text>

      {user ? (
        <>
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={28} color="#fff" />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.name}>{user.name || 'Mineral Hunter'}</Text>
              {!!user.email && <Text style={styles.muted}>{user.email}</Text>}
              {user.provider && <Text style={styles.muted}>Signed in with {PROVIDER_LABEL[user.provider]}</Text>}
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="cloud-done" size={20} color={theme.accent} />
            <Text style={styles.infoText}>
              Your {favorites.length} {favorites.length === 1 ? 'favorite is' : 'favorites are'} saved to your account
              and follow you to any phone you sign in on.
            </Text>
          </View>

          <Pressable style={styles.rowButton} onPress={doSignOut} disabled={!!busy}>
            <Text style={styles.rowButtonText}>Sign Out</Text>
            {busy === 'signout' && <ActivityIndicator />}
          </Pressable>
          <Pressable style={styles.rowButton} onPress={confirmDelete} disabled={!!busy}>
            <Text style={[styles.rowButtonText, styles.danger]}>Delete Account</Text>
            {busy === 'delete' && <ActivityIndicator />}
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.lead}>
            Sign in to keep your favorites in your account, so they follow you to a new phone.
          </Text>
          <View style={styles.signIn}>
            <SignInButtons appearance="light" />
          </View>
          <Text style={styles.muted}>
            You can keep using the map, the finder and favorites without an account.
          </Text>
        </>
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.section}>About the data</Text>
      <Text style={styles.body}>
        Sites come from the U.S. Geological Survey Mineral Resources Data System, a collection of older
        reports that is no longer kept up to date. Many sites are on private land or are abandoned
        workings. Get permission before visiting and never enter mine openings.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 14 },
  title: { fontSize: 30, fontWeight: '800', color: theme.text },
  lead: { fontSize: 16, color: theme.text, lineHeight: 22 },
  signIn: { marginVertical: 6 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1, gap: 2 },
  name: { fontSize: 18, fontWeight: '700', color: theme.text },
  muted: { fontSize: 14, color: theme.muted },
  infoRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 14, color: theme.text, lineHeight: 20 },
  rowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
  },
  rowButtonText: { fontSize: 16, fontWeight: '600', color: theme.text },
  danger: { color: theme.danger },
  error: { fontSize: 14, color: theme.danger },
  section: { fontSize: 13, fontWeight: '700', color: theme.muted, textTransform: 'uppercase', marginTop: 16 },
  body: { fontSize: 14, color: theme.muted, lineHeight: 20 },
});
