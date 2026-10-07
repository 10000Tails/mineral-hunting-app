import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import type { LatLon } from '../lib/geo';

export type PermissionState = 'checking' | 'granted' | 'denied';

/**
 * Watches the phone's position while `active` is true.
 * Asks for "while using the app" location permission the first time.
 */
export function useUserLocation(active = true, distanceInterval = 10) {
  const [permission, setPermission] = useState<PermissionState>('checking');
  const [location, setLocation] = useState<(LatLon & { accuracy: number | null }) | null>(null);

  useEffect(() => {
    if (!active) return;
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== 'granted') {
        setPermission('denied');
        return;
      }
      setPermission('granted');
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval },
        (pos) =>
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          })
      );
      if (cancelled) sub.remove();
    })().catch(() => !cancelled && setPermission('denied'));

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [active, distanceInterval]);

  return { permission, location };
}
