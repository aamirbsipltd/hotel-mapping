// Canonical hotel → region engine input.
//
// The region engine's assign() consumes a HotelPoint. currentDestinationSlug
// is the supplier's claimed destination — used as a soft signal by the
// fallback path, harmless to set.

import type { HotelPoint } from '@/regions/types';
import type { CanonicalHotel } from '../fixtures/canonical-hotel';

export function toRegionPoint(h: CanonicalHotel): HotelPoint {
  return {
    hotelKey: h.hotelKey,
    name: h.name,
    lat: h.coords.lat,
    lng: h.coords.lng,
    address: h.address,
    // Dubai is the seeded destination; the canonical coords land inside
    // Dubai Marina by design (see canonical-hotel.ts header).
    currentDestinationSlug: 'dubai',
  };
}
