import type { GeoPolygonOrMulti } from '../types';

// Engine input: a region identified by a stable id (slug for seed-fed runs,
// DB id for persisted runs) plus its geometry. Phase 2 will pass DB rows
// through this shape; Phase 1 fixtures pass SeedRegions adapted via the
// seed/index.ts loader.
export type RegionInput = {
  id: string;
  slug: string;
  name: string;
  destinationSlug: string;
  polygon: GeoPolygonOrMulti;
};

// What the index actually stores per region — precomputed once.
export type IndexedRegion = RegionInput & {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
  centroidLat: number;
  centroidLng: number;
  areaSqM: number;
};

export type AssignmentRoute =
  | 'AUTO'              // exactly one containing polygon
  | 'REVIEW_MULTI'      // overlapping polygons — suggest smallest-area
  | 'REVIEW_FALLBACK'   // outside every polygon but within FALLBACK_KM
  | 'UNASSIGNED';       // outside every polygon, beyond FALLBACK_KM

// What the brief calls `method` in the DB schema — origin, not routing.
// The engine produces AUTO or UNASSIGNED; admin reassignment writes MANUAL.
// MANUAL never originates here; it only flows in via `previous` on
// assignAll and is then preserved.
export type AssignmentMethod = 'AUTO' | 'MANUAL' | 'UNASSIGNED';

export type AssignmentResult = {
  hotelKey: string;
  route: AssignmentRoute;
  regionId: string | null;        // null for REVIEW_* and UNASSIGNED
  suggestedRegionId: string | null;
  candidateRegionIds: string[];
  confidence: number;             // 0..1
  method: AssignmentMethod;
  distanceKm: number | null;      // populated for REVIEW_FALLBACK / UNASSIGNED
};

export type ExistingAssignment = {
  hotelKey: string;
  regionId: string | null;
  method: AssignmentMethod;
  isOverride: boolean;
};

export type PreservedAssignment = ExistingAssignment & {
  preservedReason: 'MANUAL' | 'OVERRIDE';
};

export type AssignmentStats = {
  total: number;            // all hotels in
  auto: number;
  manualPreserved: number;
  review: number;           // REVIEW_MULTI + REVIEW_FALLBACK
  unassigned: number;
  autoRate: number;         // auto / (total - manualPreserved). 0 when denominator is 0.
};

export type BatchResult = {
  assignments: AssignmentResult[];        // engine-decided hotels
  preserved: PreservedAssignment[];       // skipped hotels (MANUAL/override)
  stats: AssignmentStats;
};
