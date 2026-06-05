// Region-mapping module types.
//
// `hotelKey` is a string identifier that aligns to the FASTX `hotelCode`
// convention (no shared persistent Hotel table exists in this repo today;
// the matcher's hotels are ephemeral CSV rows, FASTX uses HotelData.hotelCode).
// Keeping it a string keeps Phase 2's cross-module joins key-compatible.

export type LatLng = { lat: number; lng: number };

// GeoJSON convention. GeoPosition is [longitude, latitude] — the opposite
// order from Leaflet's [lat, lng]. All conversions live in geo/coords.ts.
export type GeoPosition = [number, number];

export type GeoLinearRing = GeoPosition[];

export type GeoPolygon = {
  type: 'Polygon';
  // First ring is the outer boundary; subsequent rings are holes.
  coordinates: GeoLinearRing[];
};

export type GeoMultiPolygon = {
  type: 'MultiPolygon';
  coordinates: GeoLinearRing[][];
};

export type GeoPolygonOrMulti = GeoPolygon | GeoMultiPolygon;

// [minLng, minLat, maxLng, maxLat] — GeoJSON convention.
export type BBox = [number, number, number, number];

export type RegionSource = 'SEED' | 'OSM' | 'MANUAL';

// In-memory shape that the seed module emits; Phase 1's engine consumes it
// directly and Phase 2's admin workbench round-trips it through the DB
// Region model. Persisted rows store polygon/bbox as serialised JSON.
export type SeedRegion = {
  slug: string;            // unique stable identifier across the module
  name: string;
  destinationSlug: string;
  polygon: GeoPolygonOrMulti;
  source: RegionSource;
  note?: string;           // optional human note about the boundary's provenance
};

export type SeedDestination = {
  slug: string;
  name: string;
  countryCode: string;     // ISO-3166-1 alpha-2
};

export type SeedCountry = {
  code: string;            // ISO-3166-1 alpha-2
  name: string;
};

export type HotelPoint = {
  hotelKey: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  // Destination the supplier *claims* the hotel is in — useful as a soft
  // signal in Phase 1's fallback / mismatch detection.
  currentDestinationSlug?: string;
};
