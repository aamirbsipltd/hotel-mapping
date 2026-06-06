// FastX workbench palette.
//
// Extends src/regions/admin/colors.ts so the matcher → regions → fastx
// stack reads as one product. Emerald = auto, amber = review, violet =
// resolved (mirrors region's "manual override"), slate = relocated /
// excluded — distinct enough that a glance separates the buckets but
// muted enough that nothing competes with the OTA categories below.

import {
  MARKER_COLORS as REGION_MARKER_COLORS,
  STATE_LABELS as REGION_STATE_LABELS,
  type MarkerState as RegionMarkerState,
} from '@/regions/admin/colors';

export type FastxRowState =
  | 'auto'        // Stage 1 or Stage 2 ≥0.85
  | 'review'      // Stage 2 0.55–0.85 with suggestion, or <0.55 unclassified
  | 'resolved'    // a previously-reviewed item that's been approved
  | 'payment'     // re-homed cardTypes
  | 'nearby'      // re-homed POI strings
  | 'excluded';   // genuine junk

export const FASTX_ROW_COLORS: Record<FastxRowState, string> = {
  auto: REGION_MARKER_COLORS.auto,         // emerald
  review: REGION_MARKER_COLORS.review,     // amber
  resolved: REGION_MARKER_COLORS.manual,   // violet — operator decision
  payment: '#0ea5e9',                       // sky — distinct from amenity vocab
  nearby: '#14b8a6',                        // teal — distinct from violet (resolved) and sky (payment)
  excluded: REGION_MARKER_COLORS.unassigned, // slate
};

export const FASTX_ROW_LABELS: Record<FastxRowState, string> = {
  auto: 'Auto-classified',
  review: 'Needs review',
  resolved: 'Resolved',
  payment: 'Re-homed → Payment',
  nearby: 'Re-homed → Nearby',
  excluded: 'Excluded',
};

// Re-export the region vocabulary so workbench code can grab the
// emerald/amber chips without crossing module boundaries by hand.
export {
  REGION_MARKER_COLORS,
  REGION_STATE_LABELS,
  type RegionMarkerState,
};
