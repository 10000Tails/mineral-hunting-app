import { useEffect, useState } from 'react';

import { fetchSiteDetails } from '../data/mrds/details';
import type { MineralSite, SiteDetails } from '../data/types';

interface Result {
  siteId: string;
  details: SiteDetails | null;
  failed: boolean;
}

/** Loads the full USGS record for one site. `details` is null when USGS has no extra record. */
export function useSiteDetails(site: MineralSite | null | undefined) {
  const [result, setResult] = useState<Result | null>(null);
  const [retry, setRetry] = useState(0);
  const siteId = site?.id;

  useEffect(() => {
    if (!site) return;
    const controller = new AbortController();
    fetchSiteDetails(site, controller.signal)
      .then((details) => setResult({ siteId: site.id, details, failed: false }))
      .catch(() => {
        if (!controller.signal.aborted) setResult({ siteId: site.id, details: null, failed: true });
      });
    return () => controller.abort();
    // Refetch only when the site itself changes, not when the object is re-created.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, retry]);

  const current = !!site && result?.siteId === site.id;
  return {
    details: current ? result!.details : null,
    loading: !!site && !current,
    failed: current && result!.failed,
    retry: () => {
      setResult(null);
      setRetry((n) => n + 1);
    },
  };
}
