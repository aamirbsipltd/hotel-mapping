// Canonical platform hotel — the single fixture all three pipelines read.
//
// HotelKey TGX-DXB-1001 deliberately matches the FastX headline fixture
// (see src/fastx/fixtures/dubai-grand-resort.ts) so the platform's
// "content" panel is identical to the /fastx hero by construction. No
// drift is possible because the content slice is a reference, not a
// re-author.
//
// Coordinates are inside the seeded Dubai Marina polygon and OUTSIDE the
// JBR overlap strip — see the integration-test "coords are inside Marina,
// not JBR" guard. The polygon corners (from src/regions/seed/regions.ts):
//   Dubai Marina: lng [55.125, 55.150], lat [25.060, 25.095]
//   JBR:          lng [55.145, 55.175], lat [25.066, 25.085]  (overlap strip)
// Canonical coords (lng=55.135, lat=25.075) sit cleanly in Marina-only
// territory: lng=55.135 < JBR's western edge of 55.145.
//
// The mock Google Place is keyless — same name, same coords (with a
// realistic ~20 m supplier-vs-GPS offset), same phone — so the matcher's
// four-signal scorer produces a deterministic AUTO match without any
// network call. A live Google Places adapter is documented as the
// "swap fixture for real data" step but not built in this brief.

import { dubaiHotel } from '../../fastx/fixtures/dubai-grand-resort';
import type { HotelData } from '../../fastx/hotelx-types';

export type LatLng = { lat: number; lng: number };

export type MockGooglePlace = {
  placeId: string;
  name: string;
  coords: LatLng;
  address: string;
  phone: string;
  rating: number;       // 0..5 — used in the match panel
  reviewCount: number;  // used in the match panel
};

export type CanonicalHotel = {
  // Single identifier shared by all three modules — this is the spine.
  hotelKey: string;
  name: string;
  coords: LatLng;
  address: string;
  phone: string;
  city: string;
  country: string;
  countryCode: string;
  // FastX HotelData slice — reference, not a re-author. Matches the
  // hotelKey via dubaiHotel.hotelCode === 'TGX-DXB-1001'.
  content: HotelData;
  // Mock Google Place candidate — fed to the matcher's scorer to produce
  // a deterministic AUTO match. Rating / reviewCount surface in the
  // match panel; the matcher itself does not read them.
  mockGooglePlace: MockGooglePlace;
};

const CANONICAL_HOTEL_KEY = 'TGX-DXB-1001';

if (dubaiHotel.hotelCode !== CANONICAL_HOTEL_KEY) {
  // Belt-and-braces — the FastX fixture's hotelCode is the spine
  // identifier. If it ever drifts from TGX-DXB-1001 the integration
  // breaks silently; better to fail at module load.
  throw new Error(
    `canonical-hotel: FastX fixture hotelCode is "${dubaiHotel.hotelCode}", expected "${CANONICAL_HOTEL_KEY}"`,
  );
}

export const canonicalHotel: CanonicalHotel = {
  hotelKey: CANONICAL_HOTEL_KEY,
  name: dubaiHotel.hotelName ?? 'Grand Dubai Marina Resort',
  coords: { lat: 25.075, lng: 55.135 },
  address: 'Marina Walk, Dubai Marina, Dubai',
  phone: '+971 4 555 1234',
  city: 'Dubai',
  country: 'United Arab Emirates',
  countryCode: 'AE',
  content: dubaiHotel,
  mockGooglePlace: {
    // Plausible-shaped Google Place ID — never used as a real key, only
    // shown in the match panel.
    placeId: 'ChIJDemoGrandDubaiMarinaResort',
    name: 'Grand Dubai Marina Resort',
    coords: { lat: 25.0752, lng: 55.1351 }, // ~22 m offset from supplier
    address: 'Dubai Marina, Marina Walk, Dubai, United Arab Emirates',
    phone: '+971 4 555 1234',
    rating: 4.6,
    reviewCount: 2843,
  },
};
