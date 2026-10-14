import type { Persistence } from 'firebase/auth';

/**
 * At runtime Metro loads Firebase Auth's React Native build, which exports
 * getReactNativePersistence, but the `firebase/auth` type definitions only describe
 * the web build. This declares the missing export.
 */
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
