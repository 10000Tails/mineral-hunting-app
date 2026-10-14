import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

/** Firebase settings come from EXPO_PUBLIC_* variables (see .env.example). */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let services: FirebaseServices | null | undefined;

/** Firebase app, auth and database — or null until the project is configured. */
export function getFirebase(): FirebaseServices | null {
  if (services !== undefined) return services;
  if (!isFirebaseConfigured) return (services = null);

  const existing = getApps().length > 0;
  const app = existing ? getApp() : initializeApp(firebaseConfig);
  // Keep people signed in between launches.
  const auth = existing ? getAuth(app) : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  services = { app, auth, db: getFirestore(app) };
  return services;
}
