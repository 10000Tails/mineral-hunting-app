import { toQueryString } from '../../lib/query';
import type { BBox, FetchOptions, MineralSite, SiteSource } from '../types';
import { toMineralSite } from './normalize';

/** USGS-hosted ArcGIS feature service for MRDS (returns GeoJSON). */
const ARCGIS_URL =
  'https://energy.usgs.gov/arcgis/rest/services/Hosted/Mineral_Resource_Data_System/FeatureServer/0/query';

export function buildArcgisUrl(bbox: BBox, limit: number): string {
  const params = toQueryString({
    where: '1=1',
    geometry: `${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}`,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'DEP_ID,SITE_NAME,DEV_STAT,URL,CODE_LIST',
    outSR: '4326',
    resultRecordCount: String(limit),
    f: 'geojson',
  });
  return `${ARCGIS_URL}?${params}`;
}

interface GeoJsonFeature {
  geometry?: { type?: string; coordinates?: unknown } | null;
  properties?: Record<string, unknown> | null;
}

export function parseArcgisGeoJson(body: unknown): MineralSite[] {
  if (!body || typeof body !== 'object') throw new Error('Empty response');
  const obj = body as { features?: GeoJsonFeature[]; error?: { message?: string } };
  if (obj.error) throw new Error(obj.error.message ?? 'ArcGIS error');
  if (!Array.isArray(obj.features)) throw new Error('Response has no features');

  const sites: MineralSite[] = [];
  for (const f of obj.features) {
    const coords = f.geometry?.coordinates;
    if (f.geometry?.type !== 'Point' || !Array.isArray(coords)) continue;
    const site = toMineralSite(f.properties ?? {}, Number(coords[0]), Number(coords[1]));
    if (site) sites.push(site);
  }
  return sites;
}

export const arcgisSource: SiteSource = {
  name: 'USGS ArcGIS',
  async fetchSites(bbox: BBox, { limit, signal }: FetchOptions) {
    const res = await fetch(buildArcgisUrl(bbox, limit), { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseArcgisGeoJson(await res.json());
  },
};
