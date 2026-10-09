import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { MineralSite } from '../data/types';

/** Saved on the phone, so favorites survive restarts and work offline. */
const STORAGE_KEY = 'mineral-hunter/favorites/v1';

export interface Favorite {
  site: MineralSite;
  savedAt: number;
}

interface FavoritesValue {
  ready: boolean;
  /** Most recently saved first. */
  favorites: Favorite[];
  isFavorite: (id: string) => boolean;
  getFavorite: (id: string) => MineralSite | undefined;
  toggleFavorite: (site: MineralSite) => void;
  removeFavorite: (id: string) => void;
}

const FavoritesContext = createContext<FavoritesValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [byId, setById] = useState<Record<string, Favorite>>({});
  const [ready, setReady] = useState(false);

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

  const update = useCallback((change: (prev: Record<string, Favorite>) => Record<string, Favorite>) => {
    setById((prev) => {
      const next = change(prev);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Object.values(next))).catch(() => {});
      return next;
    });
  }, []);

  const toggleFavorite = useCallback(
    (site: MineralSite) =>
      update((prev) => {
        const next = { ...prev };
        if (next[site.id]) delete next[site.id];
        else next[site.id] = { site, savedAt: Date.now() };
        return next;
      }),
    [update]
  );

  const removeFavorite = useCallback(
    (id: string) =>
      update((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      }),
    [update]
  );

  const value = useMemo<FavoritesValue>(
    () => ({
      ready,
      favorites: Object.values(byId).sort((a, b) => b.savedAt - a.savedAt),
      isFavorite: (id) => !!byId[id],
      getFavorite: (id) => byId[id]?.site,
      toggleFavorite,
      removeFavorite,
    }),
    [byId, ready, toggleFavorite, removeFavorite]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used inside FavoritesProvider');
  return ctx;
}
