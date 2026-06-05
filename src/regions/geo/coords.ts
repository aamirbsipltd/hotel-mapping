// Coordinate-order discipline lives in this one file.
//
//   • GeoJSON / turf  →  [lng, lat]
//   • Leaflet         →  [lat, lng]
//   • Hotels in DB    →   { lat, lng }
//
// Most bugs in this kind of work are flipped coordinates. Funnel every
// conversion through here. The DB-facing centroid is stored as separate
// (centroidLat, centroidLng) columns so a raw number-pair never sits in
// the schema without a label.
//
// Centroid + bbox helpers are simple vertex-aggregate functions — fine for
// the seed regions (small, near-convex polygons). Phase 1 will swap to
// turf's area-weighted centroid for irregular shapes; the Phase 0 values
// are good enough to anchor the rbush index and the admin map.

import type {
  BBox,
  GeoLinearRing,
  GeoPolygon,
  GeoPolygonOrMulti,
  GeoPosition,
  LatLng,
} from '../types';

export function toGeoPosition(p: LatLng): GeoPosition {
  return [p.lng, p.lat];
}

export function fromGeoPosition(p: GeoPosition): LatLng {
  return { lng: p[0], lat: p[1] };
}

// Leaflet expects [lat, lng]; this is the only place that flips order for
// the map layer. Component code should call this helper rather than
// indexing into a tuple by hand.
export function toLeafletLatLng(p: GeoPosition): [number, number] {
  return [p[1], p[0]];
}

function ringsOf(geom: GeoPolygonOrMulti): GeoLinearRing[] {
  if (geom.type === 'Polygon') return geom.coordinates;
  return geom.coordinates.flat();
}

function outerPoints(geom: GeoPolygonOrMulti): GeoPosition[] {
  const rings = ringsOf(geom);
  if (rings.length === 0) return [];
  // First ring of each polygon is the outer boundary; for the centroid /
  // bbox heuristic the outer rings give a good enough answer for seed data.
  if (geom.type === 'Polygon') return geom.coordinates[0] ?? [];
  return geom.coordinates.flatMap((rings) => rings[0] ?? []);
}

export function computeBbox(geom: GeoPolygonOrMulti): BBox {
  const pts = outerPoints(geom);
  if (pts.length === 0) {
    throw new Error('computeBbox: polygon has no coordinates');
  }
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const [lng, lat] of pts) {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }
  return [minLng, minLat, maxLng, maxLat];
}

export function computeCentroid(geom: GeoPolygonOrMulti): LatLng {
  const pts = outerPoints(geom);
  if (pts.length === 0) {
    throw new Error('computeCentroid: polygon has no coordinates');
  }
  // Drop the closing vertex (GeoJSON rings repeat the first point) so it
  // doesn't get double-weighted in the average.
  const closed =
    pts.length > 1 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1];
  const sample = closed ? pts.slice(0, -1) : pts;
  let sumLng = 0;
  let sumLat = 0;
  for (const [lng, lat] of sample) {
    sumLng += lng;
    sumLat += lat;
  }
  return { lat: sumLat / sample.length, lng: sumLng / sample.length };
}

// Quick sanity used by the seed test: does the bbox enclose every vertex
// of the polygon? If a polygon was edited and the stored bbox wasn't
// recomputed this will trip the validator before anything else uses it.
export function bboxContainsPolygon(bbox: BBox, geom: GeoPolygonOrMulti): boolean {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  for (const [lng, lat] of outerPoints(geom)) {
    if (lng < minLng || lng > maxLng || lat < minLat || lat > maxLat) return false;
  }
  return true;
}

// Lightweight polygon-builder for seed authoring. Pass [lng, lat] tuples;
// the closing point is added automatically if missing.
export function polygonFromRing(ring: GeoPosition[]): GeoPolygon {
  if (ring.length < 3) {
    throw new Error('polygonFromRing: need at least 3 vertices');
  }
  const closed =
    ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1];
  const coords = closed ? ring : [...ring, ring[0]];
  return { type: 'Polygon', coordinates: [coords] };
}
