/**
 * How MRDS commodity codes are grouped and colored on the map.
 * Edit this file to change colors, add groups, or move a code to a different group.
 * Codes not listed here fall into "Other" and still show their raw code.
 */

export interface CommodityGroup {
  key: string;
  label: string;
  color: string;
  codes: string[];
}

export const COMMODITY_GROUPS: CommodityGroup[] = [
  { key: 'gold', label: 'Gold', color: '#E0A800', codes: ['AU'] },
  { key: 'silver', label: 'Silver', color: '#8C99A6', codes: ['AG'] },
  { key: 'copper', label: 'Copper', color: '#C8642F', codes: ['CU'] },
  { key: 'lead-zinc', label: 'Lead & Zinc', color: '#6B5B95', codes: ['PB', 'ZN'] },
  { key: 'iron', label: 'Iron & Steel metals', color: '#9E2B25', codes: ['FE', 'MN', 'CR', 'TI', 'V', 'NI', 'CO', 'MO', 'W'] },
  { key: 'gems', label: 'Gems & Crystals', color: '#D6336C', codes: ['GEM', 'QTZ', 'BRL', 'CRN', 'GAR', 'TPZ', 'DIA', 'OPL', 'TRM', 'MCA'] },
  { key: 'rare', label: 'Rare & Energy metals', color: '#2B8A3E', codes: ['U', 'TH', 'REE', 'LI', 'BE', 'NB', 'TA', 'SN', 'PGE', 'PT', 'PD'] },
  { key: 'industrial', label: 'Stone, Sand & Clay', color: '#8D6E63', codes: ['SDG', 'STN', 'CLY', 'LST', 'GRV', 'SND', 'GYP', 'FLD', 'BRT', 'FLR'] },
  { key: 'other', label: 'Other', color: '#1C7ED6', codes: [] },
];

export const OTHER_GROUP = COMMODITY_GROUPS[COMMODITY_GROUPS.length - 1];

const GROUP_BY_CODE = new Map<string, CommodityGroup>();
for (const g of COMMODITY_GROUPS) for (const c of g.codes) GROUP_BY_CODE.set(c, g);

/** Readable names for common codes; anything missing shows as the raw code. */
const CODE_NAMES: Record<string, string> = {
  AU: 'Gold', AG: 'Silver', CU: 'Copper', PB: 'Lead', ZN: 'Zinc', FE: 'Iron',
  MN: 'Manganese', CR: 'Chromium', TI: 'Titanium', V: 'Vanadium', NI: 'Nickel',
  CO: 'Cobalt', MO: 'Molybdenum', W: 'Tungsten', U: 'Uranium', TH: 'Thorium',
  REE: 'Rare earths', LI: 'Lithium', BE: 'Beryllium', NB: 'Niobium', TA: 'Tantalum',
  SN: 'Tin', PGE: 'Platinum group', PT: 'Platinum', PD: 'Palladium', HG: 'Mercury',
  SB: 'Antimony', AS: 'Arsenic', BI: 'Bismuth', GEM: 'Gemstone', QTZ: 'Quartz',
  MCA: 'Mica', SDG: 'Sand & gravel', STN: 'Stone', CLY: 'Clay', GYP: 'Gypsum',
  FLD: 'Feldspar', BRT: 'Barite', FLR: 'Fluorite',
};

export function commodityName(code: string): string {
  return CODE_NAMES[code] ?? code;
}

/** A site's group is decided by its first code that belongs to a named group. */
export function groupForCodes(codes: string[]): CommodityGroup {
  for (const c of codes) {
    const g = GROUP_BY_CODE.get(c);
    if (g) return g;
  }
  return OTHER_GROUP;
}

/** Codes for metals; any other code counts as nonmetallic. */
const METALLIC_CODES = new Set([
  'AU', 'AG', 'CU', 'PB', 'ZN', 'FE', 'MN', 'CR', 'TI', 'V', 'NI', 'CO', 'MO', 'W', 'U', 'TH',
  'REE', 'LI', 'BE', 'NB', 'TA', 'SN', 'PGE', 'PT', 'PD', 'HG', 'SB', 'AS', 'BI', 'AL', 'CD',
  'GA', 'GE', 'IN', 'MG', 'RE', 'SE', 'TE', 'ZR', 'HF', 'CS', 'RB', 'SR', 'Y', 'SC', 'OS', 'IR', 'RH', 'RU',
]);

/** Metallic / Nonmetallic, worked out from the commodity codes when USGS didn't record it. */
export function commodityKindFromCodes(codes: string[]): string | undefined {
  if (codes.length === 0) return undefined;
  const metallic = codes.some((c) => METALLIC_CODES.has(c));
  const nonmetallic = codes.some((c) => !METALLIC_CODES.has(c));
  if (metallic && nonmetallic) return 'Metallic & nonmetallic';
  return metallic ? 'Metallic' : 'Nonmetallic';
}
