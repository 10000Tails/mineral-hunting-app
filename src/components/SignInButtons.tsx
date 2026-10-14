import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { isAppleSignInAvailable } from '../services/auth/apple';
import { isExpoGo } from '../services/auth/environment';
import { loadGoogle } from '../services/auth/google';
import { isFirebaseConfigured } from '../services/firebase';
import { describeAuthError, useAuth, type Provider } from '../state/auth';

interface Props {
  /** 'dark' for use over the landscape, 'light' on plain screens. */
  appearance: 'dark' | 'light';
  onSignedIn?: () => void;
}

const BUTTON_HEIGHT = 50;

/** Which sign-in options this build can offer, and why not when it can't. */
export function useSignInOptions() {
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [checked, setChecked] = useState(false);
  const google = loadGoogle();

  useEffect(() => {
    isAppleSignInAvailable().then((ok) => {
      setAppleAvailable(ok);
      setChecked(true);
    });
  }, []);

  let notice: string | null = null;
  if (isExpoGo) notice = 'Sign in with Apple or Google works in the installed app (TestFlight), not in Expo Go.';
  else if (!isFirebaseConfigured) notice = "Sign-in isn't set up yet.";
  else if (checked && !appleAvailable && !google) notice = "Sign-in isn't available on this device.";

  return { appleAvailable, google, notice, available: !notice && (appleAvailable || !!google) };
}

/**
 * Apple's and Google's own sign-in buttons. Both companies require their official
 * button designs, and Apple requires its button to be at least as prominent as Google's.
 */
export function SignInButtons({ appearance, onSignedIn }: Props) {
  const { signIn } = useAuth();
  const { appleAvailable, google, notice } = useSignInOptions();
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dark = appearance === 'dark';

  const run = async (provider: Provider) => {
    if (busy) return;
    setBusy(provider);
    setError(null);
    try {
      if (await signIn(provider)) onSignedIn?.();
    } catch (e) {
      setError(describeAuthError(e));
    } finally {
      setBusy(null);
    }
  };

  if (notice) {
    return <Text style={[styles.notice, dark ? styles.noticeDark : styles.noticeLight]}>{notice}</Text>;
  }

  const GoogleButton = google?.GoogleSigninButton;

  return (
    <View style={styles.stack}>
      {appleAvailable && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={
            dark ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={12}
          style={styles.button}
          onPress={() => run('apple')}
        />
      )}
      {GoogleButton && (
        <GoogleButton
          size={GoogleButton.Size.Wide}
          color={dark ? 'light' : 'dark'}
          disabled={!!busy}
          style={styles.button}
          onPress={() => run('google')}
        />
      )}
      {busy && <ActivityIndicator color={dark ? '#fff' : undefined} />}
      {error && <Text style={[styles.error, dark && styles.errorDark]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12, alignItems: 'stretch' },
  button: { width: '100%', height: BUTTON_HEIGHT },
  notice: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  noticeDark: { color: 'rgba(255,255,255,0.8)', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 4 },
  noticeLight: { color: '#6B645C' },
  error: { color: '#C92A2A', fontSize: 14, textAlign: 'center' },
  errorDark: { color: '#FFB4AB', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 4 },
});
