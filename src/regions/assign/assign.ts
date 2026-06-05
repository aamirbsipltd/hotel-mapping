// Single-hotel assignment — pure function.
//
// Routes (per REGION_MAPPING_BRIEF §5):
//   1 containing region  → AUTO
//   >1 containing regions → REVIEW_MULTI, suggest smallest-area
//   0 within FALLBACK_KM  → REVIEW_FALLBACK, suggest nearest centroid
//   0 beyond FALLBACK_KM  → UNASSIGNED
//
// Distance reuses src/lib/matching/geo-distance.ts → haversineKm — the
// same function the hotel matcher uses for its distance signal. Not a
// parallel implementation.

import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { haversineKm } from '@/lib/matching/geo-distance';
import type { HotelPoint } from '../types';
import type { AssignmentResult, IndexedRegion } from './types';
import { FALLBACK_KM } from './thresholds';
import type { RegionIndex } from './geo-index';

export type AssignOptions = {
  fallbackKm?: number;
};

export function assign(
  hotel: HotelPoint,
  index: RegionIndex,
  options: AssignOptions = {},
): AssignmentResult {
  const fallbackKm = options.fallbackKm ?? FALLBACK_KM;

  // Stage 1 — rbush bbox prune.
  const candidates = index.candidatesAt(hotel.lng, hotel.lat);

  // Stage 2 — exact point-in-polygon. turf accepts a [lng, lat] coordinate
  // and a Polygon/MultiPolygon geometry directly.
  const contained: IndexedRegion[] = [];
  for (const c of candidates) {
    if (booleanPointInPolygon([hotel.lng, hotel.lat], c.polygon)) {
      contained.push(c);
    }
  }

  // Sort containing regions deterministically by id so multi-match ordering
  // is independent of the order rbush happened to return candidates in.
  contained.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  if (contained.length === 1) {
    const r = contained[0];
    return {
      hotelKey: hotel.hotelKey,
      route: 'AUTO',
      regionId: r.id,
      suggestedRegionId: null,
      candidateRegionIds: [r.id],
      confidence: 1,
      method: 'AUTO',
      distanceKm: null,
    };
  }

  if (contained.length > 1) {
    // Smallest-area suggestion: the inner-most region is the most specific
    // marketed area. Ties broken by id sort above.
    const smallest = contained.reduce((a, b) =>
      a.areaSqM <= b.areaSqM ? a : b,
    );
    return {
      hotelKey: hotel.hotelKey,
      route: 'REVIEW_MULTI',
      regionId: null,
      suggestedRegionId: smallest.id,
      candidateRegionIds: contained.map((r) => r.id),
      confidence: 1 / contained.length,
      method: 'AUTO',
      distanceKm: null,
    };
  }

  // Stage 3 — proximity fallback against centroid using the matcher's
  // Haversine. Searches every region; for a tens-of-regions seed this is
  // cheap and avoids missing a region whose centroid is close but whose
  // bbox the point fell outside (the bbox prune already excluded those).
  let nearest: IndexedRegion | null = null;
  let nearestKm = Infinity;
  for (const r of index.regions) {
    const km = haversineKm(hotel.lat, hotel.lng, r.centroidLat, r.centroidLng);
    if (km < nearestKm) {
      nearestKm = km;
      nearest = r;
    } else if (
      // Deterministic tie-break — pick the region with the smaller id when
      // two centroids sit at exactly the same distance.
      km === nearestKm && nearest && r.id < nearest.id
    ) {
      nearest = r;
    }
  }

  if (nearest && nearestKm <= fallbackKm) {
    return {
      hotelKey: hotel.hotelKey,
      route: 'REVIEW_FALLBACK',
      regionId: null,
      suggestedRegionId: nearest.id,
      candidateRegionIds: [nearest.id],
      confidence: Math.max(0, 1 - nearestKm / fallbackKm),
      method: 'AUTO',
      distanceKm: nearestKm,
    };
  }

  return {
    hotelKey: hotel.hotelKey,
    route: 'UNASSIGNED',
    regionId: null,
    suggestedRegionId: null,
    candidateRegionIds: [],
    confidence: 0,
    method: 'UNASSIGNED',
    distanceKm: nearest ? nearestKm : null,
  };
}
