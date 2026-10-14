import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { OAuthProvider, type OAuthCredential } from 'firebase/auth';
import { Platform } from 'react-native';

import { isExpoGo } from './environment';

export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios' || isExpoGo) return false;
  return AppleAuthentication.isAvailableAsync().catch(() => false);
}

function randomNonce(): string {
  return Array.from(Crypto.getRandomBytes(32), (b) => b.toString(16).padStart(2, '0')).join('');
}

export interface AppleResult {
  credential: OAuthCredential;
  /** Only on first sign-in; Apple never sends the name again. */
  displayName: string | null;
  /** Needed to revoke the Apple token when the account is deleted. */
  authorizationCode: string | null;
}

/** Shows the Apple sheet and returns a Firebase credential, or null if the person cancels. */
export async function getAppleCredential(): Promise<AppleResult | null> {
  const rawNonce = randomNonce();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  try {
    const apple = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
    if (!apple.identityToken) throw new Error('Apple did not return a sign-in token.');
    const name = apple.fullName ? AppleAuthentication.formatFullName(apple.fullName).trim() : '';
    return {
      credential: new OAuthProvider('apple.com').credential({ idToken: apple.identityToken, rawNonce }),
      displayName: name || null,
      authorizationCode: apple.authorizationCode,
    };
  } catch (e) {
    if ((e as { code?: string })?.code === 'ERR_REQUEST_CANCELED') return null;
    throw e;
  }
}
