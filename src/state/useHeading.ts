import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';

import { smoothHeading } from '../lib/geo';

/**
 * Compass heading in degrees (0 = north), smoothed so markers don't jitter.
 * `accuracy` is 0–3 from iOS; below 2 means the compass should be calibrated.
 */
export function useHeading(active = true) {
  const [heading, setHeading] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number>(0);
  const last = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;

    Location.watchHeadingAsync((h) => {
      const raw = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
      last.current = smoothHeading(last.current, raw);
      setHeading(last.current);
      setAccuracy(h.accuracy);
    })
      .then((s) => {
        if (cancelled) s.remove();
        else sub = s;
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [active]);

  return { heading, accuracy };
}
