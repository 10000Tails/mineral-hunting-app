import { useEffect, useRef, useState } from 'react';

import { fetchSites } from '../data/sites';
import type { BBox, MineralSite } from '../data/types';

/**
 * Loads sites for a bounding box, cancelling stale requests when the box changes.
 * Pass null to skip loading (e.g. when zoomed too far out).
 */
export function useSitesInArea(bbox: BBox | null, limit = 500) {
  const [sites, setSites] = useState<MineralSite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const key = bbox ? [bbox.minLon, bbox.minLat, bbox.maxLon, bbox.maxLat].map((n) => n.toFixed(4)).join(',') : null;
  const bboxRef = useRef(bbox);
  bboxRef.current = bbox;

  useEffect(() => {
    if (!key || !bboxRef.current) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      fetchSites(bboxRef.current!, { limit, signal: controller.signal })
        .then((s) => {
          setSites(s);
          setLoading(false);
        })
        .catch((e) => {
          if (controller.signal.aborted) return;
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        });
    }, 350); // wait for the map to settle

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key, limit, reloadKey]);

  return { sites, loading, error, limit, reload: () => setReloadKey((k) => k + 1) };
}
