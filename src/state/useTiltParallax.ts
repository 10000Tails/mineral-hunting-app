import { Accelerometer } from 'expo-sensors';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated } from 'react-native';

/**
 * Turns phone tilt into a smoothed -1…1 offset on each axis, for parallax layers.
 * Multiply the returned values by how far (in points) each layer should travel.
 * Stays at 0 when Reduce Motion is on or the sensor is unavailable.
 */
export function useTiltParallax(active = true) {
  const [tilt] = useState(() => new Animated.ValueXY({ x: 0, y: 0 }));

  useEffect(() => {
    if (!active) return;
    let sub: { remove: () => void } | undefined;
    let cancelled = false;
    let rest: { x: number; y: number } | null = null; // how the user was holding the phone at start
    let sx = 0;
    let sy = 0;

    (async () => {
      if (await AccessibilityInfo.isReduceMotionEnabled()) return;
      if (!(await Accelerometer.isAvailableAsync()) || cancelled) return;
      Accelerometer.setUpdateInterval(16);
      sub = Accelerometer.addListener(({ x, y }) => {
        if (!rest) rest = { x, y };
        // Let the resting position drift slowly so the effect follows how the phone is held.
        rest.x += (x - rest.x) * 0.01;
        rest.y += (y - rest.y) * 0.01;
        const tx = Math.max(-1, Math.min(1, (x - rest.x) / 0.35));
        const ty = Math.max(-1, Math.min(1, (y - rest.y) / 0.35));
        sx += (tx - sx) * 0.15;
        sy += (ty - sy) * 0.15;
        tilt.setValue({ x: sx, y: sy });
      });
      if (cancelled) sub.remove();
    })().catch(() => {});

    return () => {
      cancelled = true;
      sub?.remove();
      tilt.setValue({ x: 0, y: 0 });
    };
  }, [active, tilt]);

  return tilt;
}
