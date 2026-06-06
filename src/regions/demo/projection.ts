// SVG projection helpers for the hero and any other static map-style
// visual. Equirectangular projection (good enough for a city-scale viewport
// and dramatically simpler than a real map projection — no library, no
// runtime cost). The y-axis is flipped because SVG's origin is top-left
// but latitude grows northward.
//
// Coordinate-order discipline (mirroring src/regions/geo/coords.ts):
//   • GeoJSON in → [lng, lat]
//   • Project() out → [x, y]
//   • No call site flips by hand.

import type {
  BBox,
  GeoLinearRing,
  GeoPolygonOrMulti,
  HotelPoint,
} from '../types';
import type { IndexedRegion } from '../assign/types';

export type Bbox = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

export function bboxFromArray(b: BBox): Bbox {
  return { minLng: b[0], minLat: b[1], maxLng: b[2], maxLat: b[3] };
}

export function combinedRegionBbox(regions: IndexedRegion[]): Bbox {
  if (regions.length === 0) {
    throw new Error('combinedRegionBbox: empty region list');
  }
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const r of regions) {
    if (r.minLng < minLng) minLng = r.minLng;
    if (r.minLat < minLat) minLat = r.minLat;
    if (r.maxLng > maxLng) maxLng = r.maxLng;
    if (r.maxLat > maxLat) maxLat = r.maxLat;
  }
  return { minLng, minLat, maxLng, maxLat };
}

export function expandBbox(bbox: Bbox, fraction: number): Bbox {
  const dLng = bbox.maxLng - bbox.minLng;
  const dLat = bbox.maxLat - bbox.minLat;
  const padLng = dLng * fraction;
  const padLat = dLat * fraction;
  return {
    minLng: bbox.minLng - padLng,
    minLat: bbox.minLat - padLat,
    maxLng: bbox.maxLng + padLng,
    maxLat: bbox.maxLat + padLat,
  };
}

export type Projection = (lng: number, lat: number) => [number, number];

export function makeProjection(
  bbox: Bbox,
  width: number,
  height: number,
  padding: number = 8,
): Projection {
  const dLng = bbox.maxLng - bbox.minLng;
  const dLat = bbox.maxLat - bbox.minLat;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  return (lng: number, lat: number) => {
    const x = padding + ((lng - bbox.minLng) / dLng) * innerW;
    const y = padding + (1 - (lat - bbox.minLat) / dLat) * innerH;
    return [x, y];
  };
}

function ringsOf(geom: GeoPolygonOrMulti): GeoLinearRing[] {
  if (geom.type === 'Polygon') return geom.coordinates;
  return geom.coordinates.flat();
}

export function polygonToSvgPath(
  geom: GeoPolygonOrMulti,
  project: Projection,
): string {
  let d = '';
  for (const ring of ringsOf(geom)) {
    if (ring.length === 0) continue;
    for (let i = 0; i < ring.length; i++) {
      const [lng, lat] = ring[i];
      const [x, y] = project(lng, lat);
      d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)} `;
    }
    d += 'Z ';
  }
  return d.trim();
}

export function pointInBbox(
  h: HotelPoint,
  bbox: Bbox,
  slackFraction: number = 0,
): boolean {
  const dLng = bbox.maxLng - bbox.minLng;
  const dLat = bbox.maxLat - bbox.minLat;
  const slackLng = dLng * slackFraction;
  const slackLat = dLat * slackFraction;
  return (
    h.lng >= bbox.minLng - slackLng &&
    h.lng <= bbox.maxLng + slackLng &&
    h.lat >= bbox.minLat - slackLat &&
    h.lat <= bbox.maxLat + slackLat
  );
}
