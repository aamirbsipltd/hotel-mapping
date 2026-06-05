// Batch assignment — pure function.
//
// Preserves existing MANUAL / override rows so manual decisions survive
// re-runs (the brief §5 rule that pairs with the admin workbench). The
// stats invariant is baked in here: total === auto + manualPreserved +
// review + unassigned. Any drift trips the assertion at the bottom of
// this function before the batch is returned.

import type { HotelPoint } from '../types';
import type { RegionIndex } from './geo-index';
import { assign, type AssignOptions } from './assign';
import type {
  AssignmentResult,
  AssignmentStats,
  BatchResult,
  ExistingAssignment,
  PreservedAssignment,
} from './types';

export type AssignAllOptions = AssignOptions & {
  previous?: Map<string, ExistingAssignment>;
};

function shouldPreserve(prev: ExistingAssignment | undefined): false | 'MANUAL' | 'OVERRIDE' {
  if (!prev) return false;
  if (prev.method === 'MANUAL') return 'MANUAL';
  if (prev.isOverride) return 'OVERRIDE';
  return false;
}

function reviewCount(assignments: AssignmentResult[]): number {
  let n = 0;
  for (const a of assignments) {
    if (a.route === 'REVIEW_MULTI' || a.route === 'REVIEW_FALLBACK') n++;
  }
  return n;
}

export function assignAll(
  hotels: HotelPoint[],
  index: RegionIndex,
  options: AssignAllOptions = {},
): BatchResult {
  const previous = options.previous;
  const assignments: AssignmentResult[] = [];
  const preserved: PreservedAssignment[] = [];

  for (const h of hotels) {
    const prev = previous?.get(h.hotelKey);
    const reason = shouldPreserve(prev);
    if (reason && prev) {
      preserved.push({ ...prev, preservedReason: reason });
      continue;
    }
    assignments.push(assign(h, index, options));
  }

  const auto = assignments.filter((a) => a.route === 'AUTO').length;
  const review = reviewCount(assignments);
  const unassigned = assignments.filter((a) => a.route === 'UNASSIGNED').length;
  const manualPreserved = preserved.length;
  const total = hotels.length;
  const denom = total - manualPreserved;
  const autoRate = denom > 0 ? auto / denom : 0;

  const stats: AssignmentStats = {
    total,
    auto,
    manualPreserved,
    review,
    unassigned,
    autoRate,
  };

  // Stats invariant — every hotel terminates in exactly one bucket. If
  // this trips, the engine has dropped or double-counted a hotel and the
  // before/after demo numbers will be off.
  const counted = auto + manualPreserved + review + unassigned;
  if (counted !== total) {
    throw new Error(
      `assignAll: stats invariant violated — total=${total} ≠ auto(${auto}) + manualPreserved(${manualPreserved}) + review(${review}) + unassigned(${unassigned}) = ${counted}`,
    );
  }

  return { assignments, preserved, stats };
}
