// Live reverse-geocoder stub — Nominatim / Google.
//
// Deliberately not wired in Phase 4. The seam exists so a follow-up
// activation step can drop in an endpoint without a refactor:
//
//   • Nominatim — https://nominatim.openstreetmap.org/. Free, but the
//     public instance enforces a strict usage policy (1 request/sec,
//     meaningful User-Agent, cache aggressively). Set up a private
//     instance for production volume.
//   • Google Geocoding API — requires an API key + billing account.
//
// In either case the result is suggestion-only and never produces an
// AUTO assignment (enforced by the type system; see ./index.ts).

import type { ReverseGeocodeResult, ReverseGeocoder } from './index';

export class LiveReverseGeocoder implements ReverseGeocoder {
  // Intentional no-args constructor; provider config arrives via env in
  // a follow-up phase when this is actually wired.

  async reverseGeocode(_lat: number, _lng: number): Promise<ReverseGeocodeResult> {
    void _lat;
    void _lng;
    throw new Error(
      'LiveReverseGeocoder is a stub — wire Nominatim or Google in a follow-up phase. See ./live.ts for usage-policy notes.',
    );
  }
}
