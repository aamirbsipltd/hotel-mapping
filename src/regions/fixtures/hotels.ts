// Fixture hotel inventory for the region-mapping demo. 29 hotels — Dubai
// (Marina, JBR, Palm, Downtown, Business Bay, Deira, Al Barsha) and
// Mallorca (Playa de Palma, Magaluf, Santa Ponsa, Alcúdia, Cala Millor),
// plus two edge cases that prove the Phase 1 routing:
//
//   • OVERLAP-ZONE  — H-DXB-MIX-001 sits in the deliberate strip where
//     Dubai Marina and JBR overlap. The engine should report it as a
//     multi-match review with the smaller-area region suggested.
//   • OFFSHORE      — H-DXB-OFF-001 sits in the Gulf, well beyond any
//     polygon and beyond the Haversine fallback radius the engine reuses
//     from src/lib/matching/geo-distance.ts. Should land as UNASSIGNED.
//
// Coordinates are approximate locations chosen to land inside the seed
// polygons in src/regions/seed/regions.ts; they are not the real hotels'
// addresses. hotelKey follows the FASTX `TGX-…` style so a future
// cross-module join with the amenities classifier stays key-compatible.

import type { HotelPoint } from '../types';

export const FIXTURE_HOTELS: HotelPoint[] = [
  // Dubai Marina (clean — west of the JBR overlap strip)
  { hotelKey: 'TGX-DXB-MAR-001', name: 'Marina Crescent Hotel', lat: 25.075, lng: 55.130, currentDestinationSlug: 'dubai' },
  { hotelKey: 'TGX-DXB-MAR-002', name: 'Marina Walk Suites', lat: 25.090, lng: 55.140, currentDestinationSlug: 'dubai' },
  { hotelKey: 'TGX-DXB-MAR-003', name: 'Marina Yacht Club Hotel', lat: 25.063, lng: 55.135, currentDestinationSlug: 'dubai' },

  // JBR (clean — east of the Marina overlap strip)
  { hotelKey: 'TGX-DXB-JBR-001', name: 'JBR Beachfront Resort', lat: 25.075, lng: 55.155, currentDestinationSlug: 'dubai' },
  { hotelKey: 'TGX-DXB-JBR-002', name: 'JBR Walk Hotel', lat: 25.080, lng: 55.165, currentDestinationSlug: 'dubai' },
  { hotelKey: 'TGX-DXB-JBR-003', name: 'JBR Sunset Suites', lat: 25.070, lng: 55.170, currentDestinationSlug: 'dubai' },

  // Marina ↔ JBR overlap — the multi-match canary
  { hotelKey: 'TGX-DXB-MIX-001', name: 'Marina-JBR Boundary Hotel', lat: 25.075, lng: 55.148, currentDestinationSlug: 'dubai' },

  // Palm Jumeirah
  { hotelKey: 'TGX-DXB-PJ-001', name: 'Palm Trunk Resort', lat: 25.110, lng: 55.135, currentDestinationSlug: 'dubai' },
  { hotelKey: 'TGX-DXB-PJ-002', name: 'Palm Crescent Hotel', lat: 25.115, lng: 55.140, currentDestinationSlug: 'dubai' },
  { hotelKey: 'TGX-DXB-PJ-003', name: 'Palm Outer Frond Suites', lat: 25.120, lng: 55.150, currentDestinationSlug: 'dubai' },

  // Downtown Dubai
  { hotelKey: 'TGX-DXB-DT-001', name: 'Burj View Hotel', lat: 25.190, lng: 55.270, currentDestinationSlug: 'dubai' },
  { hotelKey: 'TGX-DXB-DT-002', name: 'Mall District Hotel', lat: 25.195, lng: 55.275, currentDestinationSlug: 'dubai' },
  { hotelKey: 'TGX-DXB-DT-003', name: 'Opera District Suites', lat: 25.200, lng: 55.268, currentDestinationSlug: 'dubai' },

  // Business Bay
  { hotelKey: 'TGX-DXB-BB-001', name: 'Canal View Hotel', lat: 25.170, lng: 55.265, currentDestinationSlug: 'dubai' },
  { hotelKey: 'TGX-DXB-BB-002', name: 'Business Bay Towers', lat: 25.175, lng: 55.270, currentDestinationSlug: 'dubai' },

  // Deira
  { hotelKey: 'TGX-DXB-DE-001', name: 'Deira Creek Hotel', lat: 25.270, lng: 55.310, currentDestinationSlug: 'dubai' },
  { hotelKey: 'TGX-DXB-DE-002', name: 'Deira Souq Suites', lat: 25.280, lng: 55.315, currentDestinationSlug: 'dubai' },

  // Al Barsha
  { hotelKey: 'TGX-DXB-AB-001', name: 'Mall of the Emirates Hotel', lat: 25.105, lng: 55.200, currentDestinationSlug: 'dubai' },
  { hotelKey: 'TGX-DXB-AB-002', name: 'Al Barsha Garden Suites', lat: 25.110, lng: 55.210, currentDestinationSlug: 'dubai' },

  // Offshore — beyond fallback radius, no candidate region
  { hotelKey: 'TGX-DXB-OFF-001', name: 'Arabian Gulf Yacht Hotel', lat: 25.500, lng: 54.900, currentDestinationSlug: 'dubai' },

  // Mallorca — Playa de Palma
  { hotelKey: 'TGX-MAL-PDP-001', name: 'Playa de Palma Beach Resort', lat: 39.510, lng: 2.740, currentDestinationSlug: 'mallorca' },
  { hotelKey: 'TGX-MAL-PDP-002', name: 'S\'Arenal Boardwalk Hotel', lat: 39.515, lng: 2.745, currentDestinationSlug: 'mallorca' },
  { hotelKey: 'TGX-MAL-PDP-003', name: 'Palma Bay Suites', lat: 39.520, lng: 2.750, currentDestinationSlug: 'mallorca' },

  // Mallorca — Magaluf
  { hotelKey: 'TGX-MAL-MAG-001', name: 'Magaluf Beach Hotel', lat: 39.510, lng: 2.525, currentDestinationSlug: 'mallorca' },
  { hotelKey: 'TGX-MAL-MAG-002', name: 'Punta Ballena Resort', lat: 39.515, lng: 2.530, currentDestinationSlug: 'mallorca' },

  // Mallorca — Santa Ponsa
  { hotelKey: 'TGX-MAL-SP-001', name: 'Santa Ponsa Bay Hotel', lat: 39.510, lng: 2.480, currentDestinationSlug: 'mallorca' },
  { hotelKey: 'TGX-MAL-SP-002', name: 'Costa de la Calma Suites', lat: 39.515, lng: 2.485, currentDestinationSlug: 'mallorca' },

  // Mallorca — Alcúdia
  { hotelKey: 'TGX-MAL-AL-001', name: 'Bay of Alcúdia Resort', lat: 39.855, lng: 3.120, currentDestinationSlug: 'mallorca' },

  // Mallorca — Cala Millor
  { hotelKey: 'TGX-MAL-CM-001', name: 'Cala Millor Beachside Hotel', lat: 39.590, lng: 3.380, currentDestinationSlug: 'mallorca' },
];
