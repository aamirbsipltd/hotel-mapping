// In-memory demo computation.
//
// Public-facing pages (the /regions landing hero, destination drill-in,
// region detail) read assignments straight from the seed engine — no DB,
// no admin overrides. The DB-backed workbench (Phase 2) is the operator
// surface; this is the marketing surface. Keeping them separate means a
// fresh deploy always shows the canonical engine output, and the bid demo
// never depends on whether anyone has touched the workbench.
//
// Cached per-process: the engine result is deterministic for a given seed,
// and the seed is committed to the repo. Recompute cost is sub-millisecond
// but caching also lets us hand the IndexedRegion list out to callers
// without re-indexing.

import { buildRegionIndex, assignAll } from '../assign';
import type { BatchResult, IndexedRegion } from '../assign/types';
import { RegionIndex } from '../assign/geo-index';
import { SEED_REGIONS } from '../seed/regions';
import { seedToRegionInput } from '../seed/to-region-input';
import { FIXTURE_HOTELS } from '../fixtures/hotels';
import type { HotelPoint } from '../types';

export type DemoResult = {
  index: RegionIndex;
  result: BatchResult;
  regions: IndexedRegion[];
  hotels: HotelPoint[];
};

let cached: DemoResult | null = null;

export function getDemoResult(): DemoResult {
  if (cached) return cached;
  const index = buildRegionIndex(SEED_REGIONS.map(seedToRegionInput));
  const result = assignAll(FIXTURE_HOTELS, index);
  cached = {
    index,
    result,
    regions: index.regions,
    hotels: FIXTURE_HOTELS.map((h) => ({ ...h })),
  };
  return cached;
}

// Test-only — drops the cache so repeated test runs see a fresh compute.
export function clearDemoCache(): void {
  cached = null;
}
