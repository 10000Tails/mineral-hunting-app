import { arcgisSource } from './mrds/arcgisSource';
import { wfsSource } from './mrds/wfsSource';
import type { BBox, MineralSite, SiteSource } from './types';

/** Sources are tried in order; the first one that answers wins. */
const SOURCES: SiteSource[] = [arcgisSource, wfsSource];

/** Every site we've loaded this session, so detail screens can look sites up by id. */
const siteCache = new Map<string, MineralSite>();

export function getCachedSite(id: string): MineralSite | undefined {
  return siteCache.get(id);
}

export async function fetchSites(
  bbox: BBox,
  options: { limit?: number; signal?: AbortSignal } = {}
): Promise<MineralSite[]> {
  const limit = options.limit ?? 500;
  const errors: string[] = [];

  for (const source of SOURCES) {
    try {
      const sites = await source.fetchSites(bbox, { limit, signal: options.signal });
      for (const s of sites) siteCache.set(s.id, s);
      return sites;
    } catch (e) {
      if (options.signal?.aborted) throw e;
      errors.push(`${source.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  throw new Error(`Couldn't load USGS sites. ${errors.join(' | ')}`);
}
