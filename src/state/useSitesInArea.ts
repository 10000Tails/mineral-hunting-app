import { useEffect, useState } from 'react';

import { fetchSites } from '../data/sites';
import type { BBox, MineralSite } from '../data/types';

interface Result {
  requestKey: string;
  sites: MineralSite[];
  error: string | null;
}

/**
 * Loads sites for a bounding box, cancelling stale requests when the box changes.
 * Pass null to skip loading (e.g. when zoomed too far out).
 */
export function useSitesInArea(bbox: BBox | null, limit = 500) {
  const [result, setResult] = useState<Result | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const areaKey = bbox
    ? [bbox.minLon, bbox.minLat, bbox.maxLon, bbox.maxLat].map((n) => n.toFixed(4)).join(',')
    : null;
  const requestKey = areaKey ? `${areaKey}|${limit}|${reloadCount}` : null;

  useEffect(() => {
    if (!requestKey) return;
    const [minLon, minLat, maxLon, maxLat] = requestKey.split('|')[0].split(',').map(Number);
    const controller = new AbortController();

    const timer = setTimeout(() => {
      fetchSites({ minLon, minLat, maxLon, maxLat }, { limit, signal: controller.signal })
        .then((sites) => setResult({ requestKey, sites, error: null }))
        .catch((e) => {
          if (controller.signal.aborted) return;
          setResult((prev) => ({
            requestKey,
            sites: prev?.sites ?? [],
            error: e instanceof Error ? e.message : String(e),
          }));
        });
    }, 350); // wait for the map to settle

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [requestKey, limit]);

  const current = result?.requestKey === requestKey;
  return {
    // Keep showing the last sites while the next area loads.
    sites: result?.sites ?? [],
    loading: !!requestKey && !current,
    error: current ? result!.error : null,
    limit,
    reload: () => setReloadCount((c) => c + 1),
  };
}
