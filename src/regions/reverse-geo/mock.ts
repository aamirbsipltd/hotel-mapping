// Keyless mock — picks the nearest region centroid.
//
// Reuses src/lib/matching/geo-distance.ts → haversineKm. No third
// distance function lives in this module.

import { haversineKm } from '@/lib/matching/geo-distance';
import type { IndexedRegion } from '../assign/types';
import type {
  GeoCodeSuggestion,
  ReverseGeocodeResult,
  ReverseGeocoder,
} from './index';

// Suggestion confidence decays linearly from 1 at the centroid to 0 at
// MAX_SUGGEST_KM. Anything beyond returns NONE — better to suggest
// nothing than to anchor a far-away hint.
const MAX_SUGGEST_KM = 50;

export class MockReverseGeocoder implements ReverseGeocoder {
  constructor(private readonly regions: IndexedRegion[]) {}

  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
    if (this.regions.length === 0) {
      return { kind: 'NONE', reason: 'no regions in index' };
    }
    let bestId: string | null = null;
    let bestKm = Infinity;
    for (const r of this.regions) {
      const km = haversineKm(lat, lng, r.centroidLat, r.centroidLng);
      if (km < bestKm) {
        bestKm = km;
        bestId = r.id;
      } else if (km === bestKm && bestId !== null && r.id < bestId) {
        // Deterministic tie-break, matching assign.ts.
        bestId = r.id;
      }
    }
    if (bestId === null || bestKm > MAX_SUGGEST_KM) {
      return { kind: 'NONE', reason: 'no centroid within suggest radius' };
    }
    const suggestion: GeoCodeSuggestion = {
      regionId: bestId,
      confidence: Math.max(0, 1 - bestKm / MAX_SUGGEST_KM),
      distanceKm: bestKm,
      via: 'NEAREST_CENTROID',
    };
    return { kind: 'SUGGESTION', suggestion };
  }
}
