import { toQueryString } from '../../lib/query';
import type { BBox, FetchOptions, MineralSite, SiteSource } from '../types';
import { toMineralSite, type RawAttributes } from './normalize';

/** USGS mrdata OGC WFS for MRDS (returns GML). Used as a fallback. */
const WFS_URL = 'https://mrdata.usgs.gov/services/wfs/mrds';

export function buildWfsUrl(bbox: BBox, limit: number): string {
  // WFS 1.0.0 keeps the bbox in lon,lat order, avoiding axis-order surprises.
  const params = toQueryString({
    service: 'WFS',
    version: '1.0.0',
    request: 'GetFeature',
    typeName: 'mrds',
    maxFeatures: String(limit),
    bbox: `${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}`,
  });
  return `${WFS_URL}?${params}`;
}

function decodeXml(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&');
}

/** Reads lon/lat from a GML point (gml:coordinates "x,y" or gml:pos "x y"). */
function readPoint(xml: string): [number, number] | null {
  const coords = /<gml:coordinates[^>]*>([^<]+)<\/gml:coordinates>/.exec(xml);
  if (coords) {
    const [x, y] = coords[1].trim().split(/[\s,]+/).map(Number);
    return [x, y];
  }
  const pos = /<gml:pos[^>]*>([^<]+)<\/gml:pos>/.exec(xml);
  if (pos) {
    const [x, y] = pos[1].trim().split(/\s+/).map(Number);
    return [x, y];
  }
  return null;
}

export function parseWfsGml(xml: string): MineralSite[] {
  if (/ServiceException|ExceptionReport/.test(xml)) {
    const msg = /<(?:\w+:)?(?:ServiceException|ExceptionText)(?:\s[^>]*)?>([\s\S]*?)</.exec(xml);
    throw new Error((msg && decodeXml(msg[1]).trim()) || 'WFS error');
  }

  const sites: MineralSite[] = [];
  const members = xml.split(/<gml:featureMember[^>]*>/).slice(1);
  for (const member of members) {
    const point = readPoint(member);
    if (!point) continue;

    const attrs: RawAttributes = {};
    const fieldRe = /<(?:\w+:)?(dep_id|site_name|dev_stat|url|code_list)>([\s\S]*?)<\/(?:\w+:)?\1>/gi;
    let m: RegExpExecArray | null;
    while ((m = fieldRe.exec(member))) attrs[m[1].toLowerCase()] = decodeXml(m[2]);

    const site = toMineralSite(attrs, point[0], point[1]);
    if (site) sites.push(site);
  }
  return sites;
}

export const wfsSource: SiteSource = {
  name: 'USGS WFS',
  async fetchSites(bbox: BBox, { limit, signal }: FetchOptions) {
    const res = await fetch(buildWfsUrl(bbox, limit), { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseWfsGml(await res.text());
  },
};
