/** Development status values used by USGS MRDS. */
export const DEV_STATUSES = [
  'Producer',
  'Past Producer',
  'Prospect',
  'Occurrence',
  'Plant',
  'Unknown',
] as const;

export type DevStatus = (typeof DEV_STATUSES)[number];

/** One mine, prospect or mineral occurrence, normalized from any data source. */
export interface MineralSite {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  devStatus: DevStatus;
  /** Commodity codes in the order the source lists them, e.g. ["AU", "AG"]. */
  commodityCodes: string[];
  /** Link to the full USGS record, when the source provides one. */
  url?: string;
}

/** Geographic bounding box in decimal degrees (WGS84). */
export interface BBox {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
}

export interface FetchOptions {
  limit: number;
  signal?: AbortSignal;
}

/**
 * Anything that can return mineral sites for a map area.
 * Add a new data source by implementing this and registering it in src/data/sites.ts.
 */
export interface SiteSource {
  name: string;
  fetchSites(bbox: BBox, options: FetchOptions): Promise<MineralSite[]>;
}
