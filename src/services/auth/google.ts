import { GoogleAuthProvider, type OAuthCredential } from 'firebase/auth';

import { isExpoGo } from './environment';

type GoogleModule = typeof import('@react-native-google-signin/google-signin');

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

let googleModule: GoogleModule | null | undefined;

/**
 * The Google library is native code that isn't in Expo Go, so it's loaded only when
 * it can work. Returns null when Google sign-in isn't available in this build.
 */
export function loadGoogle(): GoogleModule | null {
  if (googleModule !== undefined) return googleModule;
  if (isExpoGo || !webClientId || !iosClientId) return (googleModule = null);
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    googleModule = require('@react-native-google-signin/google-signin') as GoogleModule;
    googleModule.GoogleSignin.configure({ webClientId, iosClientId });
  } catch {
    googleModule = null;
  }
  return googleModule;
}

export const isGoogleSignInAvailable = () => loadGoogle() !== null;

/** Shows Google's sign-in and returns a Firebase credential, or null if the person cancels. */
export async function getGoogleCredential(): Promise<OAuthCredential | null> {
  const g = loadGoogle();
  if (!g) throw new Error('Google sign-in is not available in this build.');
  try {
    await g.GoogleSignin.hasPlayServices();
    const result = await g.GoogleSignin.signIn();
    if (!g.isSuccessResponse(result)) return null;
    const idToken = result.data.idToken;
    if (!idToken) throw new Error('Google did not return a sign-in token.');
    return GoogleAuthProvider.credential(idToken);
  } catch (e) {
    if (g.isErrorWithCode(e) && e.code === g.statusCodes.SIGN_IN_CANCELLED) return null;
    throw e;
  }
}

export async function signOutOfGoogle(revoke = false) {
  const g = loadGoogle();
  if (!g) return;
  if (revoke) await g.GoogleSignin.revokeAccess().catch(() => {});
  await g.GoogleSignin.signOut().catch(() => {});
}
