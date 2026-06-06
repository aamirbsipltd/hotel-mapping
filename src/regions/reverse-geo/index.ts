// Reverse-geocode adapter — by construction a suggestion seam only.
//
// The result type intentionally lacks any way to express AUTO. Callers
// that want a region for a hotel must route a suggestion through the
// engine's review path; there is no shortcut. This makes "reverse-
// geocode never produces an AUTO assignment" a type-system guarantee
// rather than a code review one.
//
// Two implementations:
//   • MockReverseGeocoder — keyless, in-process, suggests the nearest
//     region centroid via haversineKm. Reuses the matcher's distance
//     primitive (src/lib/matching/geo-distance.ts) — no parallel.
//   • LiveReverseGeocoder — stub for Nominatim / Google. Disabled by
//     default; throws on use unless explicitly wired with an endpoint
//     and a respect-the-usage-policy acknowledgement. Documented but
//     not built in this phase.

import { MockReverseGeocoder } from './mock';
import { LiveReverseGeocoder } from './live';
import type { IndexedRegion } from '../assign/types';

export type GeoCodeSuggestion = {
  regionId: string;
  confidence: number;   // 0..1; never used to auto-assign
  distanceKm: number;
  via: 'NEAREST_CENTROID' | 'LIVE_GEOCODE';
};

// Discriminated union: 'NONE' | { suggestion: GeoCodeSuggestion }.
// No 'AUTO' member exists.
export type ReverseGeocodeResult =
  | { kind: 'NONE'; reason: string }
  | { kind: 'SUGGESTION'; suggestion: GeoCodeSuggestion };

export interface ReverseGeocoder {
  reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult>;
}

export type ReverseGeocoderSelection = 'mock' | 'live';

export function getReverseGeocoder(
  regions: IndexedRegion[],
  selection: ReverseGeocoderSelection = 'mock',
): ReverseGeocoder {
  if (selection === 'live') return new LiveReverseGeocoder();
  return new MockReverseGeocoder(regions);
}

export { MockReverseGeocoder, LiveReverseGeocoder };
