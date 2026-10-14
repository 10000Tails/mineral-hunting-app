import {
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithCredential,
  revokeAccessToken,
  signInWithCredential,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getAppleCredential } from '../services/auth/apple';
import { getGoogleCredential, signOutOfGoogle } from '../services/auth/google';
import { getFirebase } from '../services/firebase';

export type Provider = 'apple' | 'google';

export interface AccountUser {
  uid: string;
  name: string | null;
  email: string | null;
  provider: Provider | null;
}

interface AuthValue {
  /** True until we know whether someone is already signed in. */
  initializing: boolean;
  user: AccountUser | null;
  /** Resolves true when signed in, false if the person cancelled. */
  signIn: (provider: Provider) => Promise<boolean>;
  signOut: () => Promise<void>;
  /** Re-confirms with Apple/Google, erases saved data, and deletes the account. */
  deleteAccount: () => Promise<boolean>;
}

const AuthContext = createContext<AuthValue | null>(null);

function providerOf(user: User): Provider | null {
  const ids = user.providerData.map((p) => p.providerId);
  if (ids.includes('apple.com')) return 'apple';
  if (ids.includes('google.com')) return 'google';
  return null;
}

function toAccountUser(user: User): AccountUser {
  return { uid: user.uid, name: user.displayName, email: user.email, provider: providerOf(user) };
}

/** Plain-language messages for the errors people can actually hit. */
export function describeAuthError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  if (code === 'auth/account-exists-with-different-credential')
    return 'That email is already used with the other sign-in option. Sign in with that one instead.';
  if (code === 'auth/network-request-failed') return 'No internet connection. Try again when you have signal.';
  if (code === 'auth/user-mismatch') return 'Please confirm with the same Apple or Google account you signed in with.';
  return e instanceof Error ? e.message : 'Sign-in failed. Please try again.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const firebase = getFirebase();
  const [user, setUser] = useState<AccountUser | null>(null);
  const [initializing, setInitializing] = useState(!!firebase);

  useEffect(() => {
    if (!firebase) return;
    return onAuthStateChanged(firebase.auth, (u) => {
      setUser(u ? toAccountUser(u) : null);
      setInitializing(false);
    });
  }, [firebase]);

  const signIn = useCallback(
    async (provider: Provider) => {
      if (!firebase) throw new Error("Sign-in isn't set up yet.");
      if (provider === 'apple') {
        const result = await getAppleCredential();
        if (!result) return false;
        const { user: u } = await signInWithCredential(firebase.auth, result.credential);
        if (result.displayName && !u.displayName) {
          await updateProfile(u, { displayName: result.displayName }).catch(() => {});
          setUser(toAccountUser(u));
        }
        return true;
      }
      const credential = await getGoogleCredential();
      if (!credential) return false;
      await signInWithCredential(firebase.auth, credential);
      return true;
    },
    [firebase]
  );

  const signOut = useCallback(async () => {
    if (!firebase) return;
    if (user?.provider === 'google') await signOutOfGoogle();
    await firebaseSignOut(firebase.auth);
  }, [firebase, user?.provider]);

  const deleteAccount = useCallback(async () => {
    const current = firebase?.auth.currentUser;
    if (!firebase || !current) return false;
    const provider = providerOf(current);

    // Deleting needs a fresh sign-in, so ask Apple/Google to confirm it's really them.
    let appleCode: string | null = null;
    if (provider === 'apple') {
      const result = await getAppleCredential();
      if (!result) return false;
      await reauthenticateWithCredential(current, result.credential);
      appleCode = result.authorizationCode;
    } else if (provider === 'google') {
      const credential = await getGoogleCredential();
      if (!credential) return false;
      await reauthenticateWithCredential(current, credential);
    }

    // Erase saved favorites, then the account itself.
    const favs = await getDocs(collection(firebase.db, 'users', current.uid, 'favorites'));
    await Promise.all(favs.docs.map((d) => deleteDoc(d.ref)));
    await deleteDoc(doc(firebase.db, 'users', current.uid)).catch(() => {});

    // Apple requires apps to revoke their Sign in with Apple token when an account is deleted.
    if (appleCode) await revokeAccessToken(firebase.auth, appleCode);
    if (provider === 'google') await signOutOfGoogle(true);
    await deleteUser(current);
    return true;
  }, [firebase]);

  const value = useMemo<AuthValue>(
    () => ({ initializing, user, signIn, signOut, deleteAccount }),
    [initializing, user, signIn, signOut, deleteAccount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
