import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import type { MineralSite } from '../data/types';
import { getFirebase } from '../services/firebase';
import { useAuth } from './auth';

/** Always saved on the phone, so favorites survive restarts and work offline. */
const STORAGE_KEY = 'mineral-hunter/favorites/v1';

export interface Favorite {
  site: MineralSite;
  savedAt: number;
}

type FavoritesMap = Record<string, Favorite>;

interface FavoritesValue {
  ready: boolean;
  /** True when favorites are also kept in the signed-in account. */
  syncing: boolean;
  /** Most recently saved first. */
  favorites: Favorite[];
  isFavorite: (id: string) => boolean;
  getFavorite: (id: string) => MineralSite | undefined;
  toggleFavorite: (site: MineralSite) => void;
  removeFavorite: (id: string) => void;
}

const FavoritesContext = createContext<FavoritesValue | null>(null);

const saveLocal = (map: FavoritesMap) =>
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Object.values(map))).catch(() => {});

/** Firestore rejects `undefined` fields, so store a JSON-clean copy. */
const clean = (f: Favorite): Favorite => JSON.parse(JSON.stringify(f));

/** Account copy lives at users/{uid}/favorites/{siteId}. */
function favoriteDoc(uid: string, siteId: string) {
  const fb = getFirebase()!;
  return doc(fb.db, 'users', uid, 'favorites', encodeURIComponent(siteId));
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [byId, setById] = useState<FavoritesMap>({});
  const [ready, setReady] = useState(false);
  const latest = useRef<FavoritesMap>({});

  useEffect(() => {
    latest.current = byId;
  }, [byId]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const list = JSON.parse(raw) as Favorite[];
        if (Array.isArray(list)) setById(Object.fromEntries(list.map((f) => [f.site.id, f])));
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // While signed in, follow the account's favorites. On the first update, upload any
  // favorites saved on this phone that the account doesn't have yet, so nothing is lost.
  useEffect(() => {
    const fb = getFirebase();
    if (!fb || !uid || !ready) return;
    let first = true;
    return onSnapshot(
      collection(fb.db, 'users', uid, 'favorites'),
      (snap) => {
        const cloud: FavoritesMap = {};
        snap.forEach((d) => {
          const f = d.data() as Favorite;
          if (f?.site?.id) cloud[f.site.id] = f;
        });
        let merged = cloud;
        if (first) {
          first = false;
          const localOnly = Object.values(latest.current).filter((f) => !cloud[f.site.id]);
          localOnly.forEach((f) => setDoc(favoriteDoc(uid, f.site.id), clean(f)).catch(() => {}));
          merged = { ...cloud, ...Object.fromEntries(localOnly.map((f) => [f.site.id, f])) };
        }
        setById(merged);
        saveLocal(merged);
      },
      () => {} // offline or permission problem: keep using the copy on the phone
    );
  }, [uid, ready]);

  const update = useCallback((change: (prev: FavoritesMap) => FavoritesMap) => {
    const next = change(latest.current);
    latest.current = next;
    setById(next);
    saveLocal(next);
  }, []);

  const toggleFavorite = useCallback(
    (site: MineralSite) => {
      const existing = latest.current[site.id];
      const fav: Favorite = { site, savedAt: Date.now() };
      update((prev) => {
        const next = { ...prev };
        if (existing) delete next[site.id];
        else next[site.id] = fav;
        return next;
      });
      if (uid) {
        const ref = favoriteDoc(uid, site.id);
        (existing ? deleteDoc(ref) : setDoc(ref, clean(fav))).catch(() => {});
      }
    },
    [update, uid]
  );

  const removeFavorite = useCallback(
    (id: string) => {
      update((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (uid) deleteDoc(favoriteDoc(uid, id)).catch(() => {});
    },
    [update, uid]
  );

  const value = useMemo<FavoritesValue>(
    () => ({
      ready,
      syncing: !!uid,
      favorites: Object.values(byId).sort((a, b) => b.savedAt - a.savedAt),
      isFavorite: (id) => !!byId[id],
      getFavorite: (id) => byId[id]?.site,
      toggleFavorite,
      removeFavorite,
    }),
    [byId, ready, uid, toggleFavorite, removeFavorite]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used inside FavoritesProvider');
  return ctx;
}
