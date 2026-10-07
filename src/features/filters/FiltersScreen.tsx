import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { COMMODITY_GROUPS } from '../../config/commodities';
import { theme } from '../../config/theme';
import { DEV_STATUSES, type DevStatus } from '../../data/types';
import { useFilters } from '../../state/filters';

const STATUS_HELP: Record<DevStatus, string> = {
  Producer: 'Active mine or operation',
  'Past Producer': 'Old mine that produced ore',
  Prospect: 'Explored but never produced',
  Occurrence: 'Mineral reported here, no workings',
  Plant: 'Processing plant or mill',
  Unknown: 'Status not recorded',
};

export default function FiltersScreen() {
  const f = useFilters();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.section}>Minerals</Text>
        <Pressable onPress={() => f.setAllGroups(f.groups.size !== COMMODITY_GROUPS.length)}>
          <Text style={styles.link}>{f.groups.size === COMMODITY_GROUPS.length ? 'None' : 'All'}</Text>
        </Pressable>
      </View>
      <View style={styles.card}>
        {COMMODITY_GROUPS.map((g, i) => (
          <View key={g.key} style={[styles.row, i > 0 && styles.divider]}>
            <View style={[styles.dot, { backgroundColor: g.color }]} />
            <Text style={styles.label}>{g.label}</Text>
            <Switch value={f.groups.has(g.key)} onValueChange={() => f.toggleGroup(g.key)} trackColor={{ true: theme.accent }} />
          </View>
        ))}
      </View>

      <Text style={styles.section}>Site type</Text>
      <View style={styles.card}>
        {DEV_STATUSES.map((s, i) => (
          <View key={s} style={[styles.row, i > 0 && styles.divider]}>
            <View style={styles.labelBlock}>
              <Text style={styles.label}>{s}</Text>
              <Text style={styles.help}>{STATUS_HELP[s]}</Text>
            </View>
            <Switch value={f.statuses.has(s)} onValueChange={() => f.toggleStatus(s)} trackColor={{ true: theme.accent }} />
          </View>
        ))}
      </View>

      <Pressable onPress={f.reset} style={styles.reset}>
        <Text style={styles.link}>Reset all filters</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  content: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  section: { fontSize: 13, fontWeight: '700', color: theme.muted, textTransform: 'uppercase', marginTop: 16, marginBottom: 8 },
  card: { backgroundColor: theme.card, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
  dot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  labelBlock: { flex: 1 },
  label: { flex: 1, fontSize: 16, color: theme.text },
  help: { fontSize: 12, color: theme.muted, marginTop: 2 },
  link: { color: theme.accent, fontSize: 15, fontWeight: '600' },
  reset: { alignItems: 'center', marginTop: 24 },
});
