import { toQueryString } from '../../lib/query';
import type { MineralSite, SiteDetails } from '../types';

/**
 * The map layer only carries name, status and commodity codes. Everything else
 * (location names, commodity type, operation type…) comes from the full USGS
 * record, which we fetch for one site at a time when it's tapped.
 */
const WFS_URL = 'https://mrdata.usgs.gov/services/wfs/mrds';

/** A tiny box around the site; we then pick the matching record by its id. */
export function buildDetailUrl(site: Pick<MineralSite, 'latitude' | 'longitude'>): string {
  const d = 0.0005; // ~50 m
  return `${WFS_URL}?${toQueryString({
    service: 'WFS',
    version: '1.0.0',
    request: 'GetFeature',
    typeName: 'mrds',
    maxFeatures: '25',
    bbox: `${site.longitude - d},${site.latitude - d},${site.longitude + d},${site.latitude + d}`,
  })}`;
}

function decodeXml(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')
    .trim();
}

/** Every simple (text-only) attribute of every feature in a GML response, keys lower-cased. */
export function parseGmlAttributes(xml: string): Record<string, string>[] {
  const records: Record<string, string>[] = [];
  for (const member of xml.split(/<gml:featureMember[^>]*>/).slice(1)) {
    const attrs: Record<string, string> = {};
    const re = /<(?!gml:)(?:[\w-]+:)?([\w-]+)>([^<]*)<\/(?:[\w-]+:)?\1>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(member))) {
      const value = decodeXml(m[2]);
      if (value) attrs[m[1].toLowerCase()] = value;
    }
    records.push(attrs);
  }
  return records;
}

function first(attrs: Record<string, string>, ...keys: string[]): string | undefined {
  for (const k of keys) if (attrs[k]) return attrs[k];
  return undefined;
}

const COMMODITY_TYPES: Record<string, string> = {
  M: 'Metallic',
  N: 'Nonmetallic',
  B: 'Metallic & nonmetallic',
  E: 'Energy',
};

const PRODUCTION_SIZES: Record<string, string> = {
  S: 'Small',
  M: 'Medium',
  L: 'Large',
  Y: 'Produced (size not recorded)',
  N: 'None',
  U: 'Unknown',
};

const expand = (table: Record<string, string>, v?: string) => (v ? table[v.toUpperCase()] ?? v : undefined);

/** Maps raw USGS field names (several naming schemes exist) onto SiteDetails. */
export function toSiteDetails(attrs: Record<string, string>): SiteDetails {
  const details: SiteDetails = {
    country: first(attrs, 'country'),
    state: first(attrs, 'state'),
    county: first(attrs, 'county'),
    commodityType: expand(COMMODITY_TYPES, first(attrs, 'com_type')),
    majorCommodities: first(attrs, 'commod1', 'com_major'),
    minorCommodities: first(attrs, 'commod2', 'com_minor'),
    traceCommodities: first(attrs, 'commod3', 'com_trace'),
    operationType: first(attrs, 'oper_type'),
    productionSize: expand(PRODUCTION_SIZES, first(attrs, 'prod_size')),
    depositType: first(attrs, 'dep_type', 'model'),
    oreMinerals: first(attrs, 'ore'),
    gangueMinerals: first(attrs, 'gangue'),
    otherMaterials: first(attrs, 'other_matl'),
    discoveryYear: first(attrs, 'disc_yr'),
    firstProductionYear: first(attrs, 'yr_fst_prd'),
    lastProductionYear: first(attrs, 'yr_lst_prd'),
  };
  for (const k of Object.keys(details) as (keyof SiteDetails)[]) {
    if (details[k] === undefined) delete details[k];
  }
  return details;
}

/** Picks this site's record out of a GML response (by id, else the only record). */
export function pickSiteDetails(xml: string, siteId: string): SiteDetails | null {
  if (/ServiceException|ExceptionReport/.test(xml)) throw new Error('USGS returned an error');
  const records = parseGmlAttributes(xml);
  const match =
    records.find((r) => r.dep_id === siteId) ?? (records.length === 1 ? records[0] : undefined);
  return match ? toSiteDetails(match) : null;
}

const cache = new Map<string, SiteDetails | null>();

export async function fetchSiteDetails(site: MineralSite, signal?: AbortSignal): Promise<SiteDetails | null> {
  if (cache.has(site.id)) return cache.get(site.id)!;
  const res = await fetch(buildDetailUrl(site), { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const details = pickSiteDetails(await res.text(), site.id);
  cache.set(site.id, details);
  return details;
}
