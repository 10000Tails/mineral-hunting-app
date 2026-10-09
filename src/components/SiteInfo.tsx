import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { commodityKindFromCodes, commodityName } from '../config/commodities';
import { theme } from '../config/theme';
import type { MineralSite, SiteDetails } from '../data/types';
import { useSiteDetails } from '../state/useSiteDetails';

function formatCoordinates(lat: number, lon: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(5)}° ${ns}, ${Math.abs(lon).toFixed(5)}° ${ew}`;
}

function pointOfReference(d: SiteDetails | null): string | undefined {
  if (!d) return undefined;
  const county = d.county && !/county|parish|borough/i.test(d.county) ? `${d.county} County` : d.county;
  const parts = [county, d.state, d.country && d.country !== 'United States' ? d.country : undefined];
  return parts.filter(Boolean).join(', ') || undefined;
}

function yearsLine(d: SiteDetails | null): string | undefined {
  if (!d) return undefined;
  const bits: string[] = [];
  if (d.discoveryYear) bits.push(`Discovered ${d.discoveryYear}`);
  if (d.firstProductionYear && d.lastProductionYear) bits.push(`Produced ${d.firstProductionYear}–${d.lastProductionYear}`);
  else if (d.firstProductionYear) bits.push(`First production ${d.firstProductionYear}`);
  else if (d.lastProductionYear) bits.push(`Last production ${d.lastProductionYear}`);
  return bits.join(' · ') || undefined;
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} selectable>
        {value}
      </Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

/**
 * The facts for one site, grouped the way USGS reports them. Core facts show immediately;
 * the rest fill in once the full USGS record loads.
 */
export function SiteInfo({ site }: { site: MineralSite }) {
  const { details, loading, failed, retry } = useSiteDetails(site);
  const d = details;

  const commodityList =
    d?.majorCommodities ?? (site.commodityCodes.map(commodityName).join(', ') || 'None listed');
  const others = [
    d?.minorCommodities && `Minor: ${d.minorCommodities}`,
    d?.traceCommodities && `Trace: ${d.traceCommodities}`,
  ].filter(Boolean) as string[];
  const hasOtherMinerals = others.length || d?.oreMinerals || d?.gangueMinerals || d?.otherMaterials;
  const hasEconomic = d?.operationType || d?.productionSize || d?.depositType;

  return (
    <View>
      <Section title="Geographic coordinates">
        <Row label="Coordinates" value={formatCoordinates(site.latitude, site.longitude)} />
        <Row label="Point of reference" value={pointOfReference(d)} />
      </Section>

      <Section title="Development status">
        <Row label="Status" value={site.devStatus} />
        <Row label="History" value={yearsLine(d)} />
      </Section>

      <Section title="Commodity">
        <Row label="Commodity type" value={d?.commodityType ?? commodityKindFromCodes(site.commodityCodes)} />
        <Row label="Main commodities" value={commodityList} />
      </Section>

      {hasEconomic ? (
        <Section title="Economic information">
          <Row label="Operation type" value={d?.operationType} />
          <Row label="Production size" value={d?.productionSize} />
          <Row label="Deposit type" value={d?.depositType} />
        </Section>
      ) : null}

      {hasOtherMinerals ? (
        <Section title="Other minerals reported">
          {others.map((o) => (
            <Text key={o} style={styles.value}>
              {o}
            </Text>
          ))}
          <Row label="Ore minerals" value={d?.oreMinerals} />
          <Row label="Gangue (waste rock) minerals" value={d?.gangueMinerals} />
          <Row label="Other materials" value={d?.otherMaterials} />
        </Section>
      ) : null}

      {loading && (
        <View style={styles.status}>
          <ActivityIndicator size="small" color={theme.accent} />
          <Text style={styles.statusText}>Loading full USGS record…</Text>
        </View>
      )}
      {failed && (
        <Pressable onPress={retry} style={styles.status} hitSlop={6}>
          <Text style={styles.statusText}>
            {"Couldn't load the full USGS record. "}
            <Text style={styles.retry}>Try again</Text>
          </Text>
        </Pressable>
      )}
      {!loading && !failed && !d && (
        <Text style={[styles.statusText, styles.status]}>USGS has no extended record for this site.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 14 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  row: { marginTop: 4 },
  label: { fontSize: 12, color: theme.muted },
  value: { fontSize: 15, color: theme.text, marginTop: 1 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  statusText: { fontSize: 13, color: theme.muted },
  retry: { color: theme.accent, fontWeight: '600' },
});
