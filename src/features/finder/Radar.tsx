import { StyleSheet, Text, View } from 'react-native';

import type { Target } from './targets';

interface Props {
  targets: Target[];
  radiusMeters: number;
  fovDegrees: number;
  size?: number;
}

/** Small top-down radar: you're in the middle, the direction you face is up. */
export function Radar({ targets, radiusMeters, fovDegrees, size = 110 }: Props) {
  const r = size / 2;
  return (
    <View style={[styles.radar, { width: size, height: size, borderRadius: r }]}>
      {/* field-of-view wedge, drawn as two lines */}
      {[-fovDegrees / 2, fovDegrees / 2].map((a) => (
        <View
          key={a}
          style={[
            styles.fovLine,
            { height: r, left: r - 0.5, top: 0, transform: [{ translateY: r / 2 }, { rotate: `${a}deg` }, { translateY: -r / 2 }] },
          ]}
        />
      ))}
      <View style={[styles.ring, { width: r, height: r, borderRadius: r / 2, left: r / 2, top: r / 2 }]} />
      {targets.map((t) => {
        const d = Math.min(t.distance / radiusMeters, 1) * (r - 5);
        const rad = (t.relative * Math.PI) / 180;
        return (
          <View
            key={t.site.id}
            style={[styles.blip, { backgroundColor: t.color, left: r + Math.sin(rad) * d - 4, top: r - Math.cos(rad) * d - 4 }]}
          />
        );
      })}
      <View style={[styles.me, { left: r - 5, top: r - 5 }]} />
      <Text style={[styles.label, { left: r - 4 }]}>▲</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  radar: { backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', overflow: 'hidden' },
  ring: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  fovLine: { position: 'absolute', width: 1, backgroundColor: 'rgba(255,255,255,0.35)' },
  blip: { position: 'absolute', width: 8, height: 8, borderRadius: 4, borderWidth: 1, borderColor: '#fff' },
  me: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  label: { position: 'absolute', top: 2, color: '#fff', fontSize: 8 },
});
