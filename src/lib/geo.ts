import type { BBox } from '../data/types';

const EARTH_RADIUS_M = 6_371_000;
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

export interface LatLon {
  latitude: number;
  longitude: number;
}

/** Great-circle distance in meters. */
export function distanceMeters(a: LatLon, b: LatLon): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Initial compass bearing from a to b, 0–360° (0 = north). */
export function bearingDegrees(a: LatLon, b: LatLon): number {
  const φ1 = toRad(a.latitude);
  const φ2 = toRad(b.latitude);
  const Δλ = toRad(b.longitude - a.longitude);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return normalizeDegrees(toDeg(Math.atan2(y, x)));
}

export function normalizeDegrees(d: number): number {
  return ((d % 360) + 360) % 360;
}

/** Signed difference target − heading in the range −180…180. */
export function relativeAngle(target: number, heading: number): number {
  const d = normalizeDegrees(target - heading);
  return d > 180 ? d - 360 : d;
}

/** Smooths compass readings without jumping when crossing north. */
export function smoothHeading(previous: number | null, next: number, factor = 0.2): number {
  if (previous == null) return normalizeDegrees(next);
  return normalizeDegrees(previous + relativeAngle(next, previous) * factor);
}

/** Square box of the given radius around a point. */
export function bboxAround(center: LatLon, radiusMeters: number): BBox {
  const dLat = toDeg(radiusMeters / EARTH_RADIUS_M);
  const dLon = toDeg(radiusMeters / (EARTH_RADIUS_M * Math.cos(toRad(center.latitude))));
  return {
    minLat: center.latitude - dLat,
    maxLat: center.latitude + dLat,
    minLon: center.longitude - dLon,
    maxLon: center.longitude + dLon,
  };
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export function compassPoint(bearing: number): string {
  return COMPASS[Math.round(normalizeDegrees(bearing) / 45) % 8];
}

/** US-friendly distance: feet under a tenth of a mile, miles otherwise. */
export function formatDistance(meters: number): string {
  const miles = meters / 1609.344;
  if (miles < 0.1) return `${Math.round(meters * 3.28084)} ft`;
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}
