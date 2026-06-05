import type { SeedRegion } from '../types';
import type { RegionInput } from '../assign/types';

// Seed regions use slug as their stable id (the DB row will use cuid in
// Phase 2). Engine consumers that feed seed data through `buildRegionIndex`
// pass it via this adapter so they don't have to know about the seed shape.
export function seedToRegionInput(r: SeedRegion): RegionInput {
  return {
    id: r.slug,
    slug: r.slug,
    name: r.name,
    destinationSlug: r.destinationSlug,
    polygon: r.polygon,
  };
}
