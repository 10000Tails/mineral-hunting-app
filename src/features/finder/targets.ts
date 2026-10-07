import { groupForCodes } from '../../config/commodities';
import type { MineralSite } from '../../data/types';
import { bearingDegrees, distanceMeters, relativeAngle, type LatLon } from '../../lib/geo';

export interface Target {
  site: MineralSite;
  color: string;
  distance: number;
  bearing: number;
  /** Angle from where the phone points, −180…180 (negative = to the left). */
  relative: number;
}

export function buildTargets(
  sites: MineralSite[],
  from: LatLon,
  heading: number,
  radiusMeters: number,
  max = 40
): Target[] {
  return sites
    .map((site) => {
      const bearing = bearingDegrees(from, site);
      return {
        site,
        color: groupForCodes(site.commodityCodes).color,
        distance: distanceMeters(from, site),
        bearing,
        relative: relativeAngle(bearing, heading),
      };
    })
    .filter((t) => t.distance <= radiusMeters)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, max);
}

export interface PlacedTag {
  target: Target;
  x: number;
  y: number;
}

/**
 * Places targets inside the camera's field of view on screen.
 * Horizontal position follows the bearing; closer sites sit lower, like the ground in front of you.
 * Tags that would overlap are nudged upward.
 */
export function placeTags(
  targets: Target[],
  fovDegrees: number,
  width: number,
  height: number,
  radiusMeters: number,
  tagWidth = 150,
  tagHeight = 44
): PlacedTag[] {
  const half = fovDegrees / 2;
  const placed: PlacedTag[] = [];

  for (const target of targets) {
    if (Math.abs(target.relative) > half) continue;
    const x = width / 2 + (target.relative / half) * (width / 2);
    const nearness = 1 - Math.sqrt(Math.min(target.distance / radiusMeters, 1));
    let y = height * 0.18 + nearness * height * 0.42;

    for (let tries = 0; tries < 8; tries++) {
      const hit = placed.some((p) => Math.abs(p.x - x) < tagWidth * 0.9 && Math.abs(p.y - y) < tagHeight);
      if (!hit) break;
      y -= tagHeight;
    }
    placed.push({ target, x, y: Math.max(8, y) });
  }
  return placed;
}
