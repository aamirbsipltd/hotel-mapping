// In-memory deterministic demo classification.
//
// Mirrors src/regions/demo/compute.ts. The public /fastx hero must render
// for anonymous visitors without touching the database; the workbench
// (Phase 2) is the operator surface, this is the marketing surface.
//
// The demo result is the pure Phase 1 pipeline output over a fixture,
// memoised. A test asserts the demo equals the canonical pipeline output
// — there is no second classifier in this module.

import type { HotelData } from '../hotelx-types';
import { classifyHotel, type ClassifyResult } from '../classify';
import { FIXTURES, dubaiHotel, baselHotel } from '../fixtures';

export type DemoClassification = {
  hotel: HotelData;
  result: ClassifyResult;
};

const cache = new Map<string, DemoClassification>();

// Headline fixture for the /fastx before/after hero — the one with the
// cited junk that the bid narrative leans on.
export const HEADLINE_HOTEL_CODE = 'TGX-DXB-1001';

export function getDemoClassification(hotelCode: string): DemoClassification {
  const cached = cache.get(hotelCode);
  if (cached) return cached;
  const hotel = FIXTURES.find((h) => h.hotelCode === hotelCode);
  if (!hotel) {
    throw new Error(`getDemoClassification: unknown hotelCode "${hotelCode}"`);
  }
  const result = classifyHotel(hotel);
  const out: DemoClassification = { hotel, result };
  cache.set(hotelCode, out);
  return out;
}

export function getHeadlineClassification(): DemoClassification {
  return getDemoClassification(HEADLINE_HOTEL_CODE);
}

export function getAllDemoClassifications(): DemoClassification[] {
  return FIXTURES.map((h) => getDemoClassification(h.hotelCode));
}

// Test-only cache reset.
export function clearDemoCache(): void {
  cache.clear();
}

export { dubaiHotel, baselHotel };
