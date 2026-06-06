// Canonical hotel → matcher inputs.
//
// The matcher's scorer (src/lib/matching/score.ts) takes a SourceHotel
// + a list of CandidateHotel and returns scored matches. For the
// platform spine, the candidate list is exactly one mock Google Place
// paired to the canonical hotel; the scorer's four-signal output is
// the same shape the live Google Places path would produce.

import type { CandidateHotel, SourceHotel } from '@/lib/matching/score';
import type { CanonicalHotel, MockGooglePlace } from '../fixtures/canonical-hotel';

export function toMatcherSource(h: CanonicalHotel): SourceHotel {
  return {
    id: h.hotelKey,
    name: h.name,
    city: h.city,
    country: h.country,
    address: h.address,
    latitude: h.coords.lat,
    longitude: h.coords.lng,
    phone: h.phone,
  };
}

export function toMatcherCandidate(p: MockGooglePlace): CandidateHotel {
  return {
    locationId: p.placeId,
    name: p.name,
    address: p.address,
    latitude: p.coords.lat,
    longitude: p.coords.lng,
    phone: p.phone,
  };
}
