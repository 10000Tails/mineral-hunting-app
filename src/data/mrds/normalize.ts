import { DEV_STATUSES, type DevStatus, type MineralSite } from '../types';

/** Raw MRDS attributes, keyed case-insensitively (sources disagree on DEP_ID vs dep_id). */
export type RawAttributes = Record<string, unknown>;

function pick(attrs: RawAttributes, key: string): string | undefined {
  const target = key.toLowerCase();
  for (const [k, v] of Object.entries(attrs)) {
    if (k.toLowerCase() === target && v != null && String(v).trim() !== '') {
      return String(v).trim();
    }
  }
  return undefined;
}

export function normalizeDevStatus(value: string | undefined): DevStatus {
  if (!value) return 'Unknown';
  const v = value.trim().toLowerCase();
  const match = DEV_STATUSES.find((s) => s.toLowerCase() === v);
  return match ?? 'Unknown';
}

/** "AU AG, CU" → ["AU", "AG", "CU"] */
export function parseCodeList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[\s,;]+/)
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
}

/** Turns one raw MRDS record plus its coordinates into a MineralSite, or null if unusable. */
export function toMineralSite(
  attrs: RawAttributes,
  longitude: number,
  latitude: number
): MineralSite | null {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;

  const id = pick(attrs, 'dep_id') ?? pick(attrs, 'objectid') ?? `${latitude},${longitude}`;
  const url = pick(attrs, 'url');

  return {
    id,
    name: pick(attrs, 'site_name') ?? 'Unnamed site',
    latitude,
    longitude,
    devStatus: normalizeDevStatus(pick(attrs, 'dev_stat')),
    commodityCodes: parseCodeList(pick(attrs, 'code_list')),
    url: url ?? (pick(attrs, 'dep_id') ? `https://mrdata.usgs.gov/mrds/show-mrds.php?dep_id=${pick(attrs, 'dep_id')}` : undefined),
  };
}
