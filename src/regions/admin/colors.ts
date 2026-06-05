// Color palettes for the admin map.
//
// Destination palette is qualitative — distinct hues per destination so
// adjacent regions are visually grouped. State palette mirrors the
// matcher's emerald/amber/muted vocabulary so an operator who knows that
// surface can read this one without re-learning.

import type { AssignmentRoute, AssignmentMethod } from '../assign/types';

const DESTINATION_PALETTE = [
  '#059669', // emerald — Dubai (primary)
  '#0ea5e9', // sky — Mallorca
  '#a855f7', // violet
  '#f59e0b', // amber
  '#ef4444', // rose
  '#14b8a6', // teal
  '#84cc16', // lime
];

export function destinationColor(destinationSlug: string, allSlugs: string[]): string {
  const i = allSlugs.indexOf(destinationSlug);
  if (i < 0) return DESTINATION_PALETTE[0];
  return DESTINATION_PALETTE[i % DESTINATION_PALETTE.length];
}

export type MarkerState = 'auto' | 'manual' | 'review' | 'unassigned';

export function markerState(args: {
  method?: AssignmentMethod;
  isOverride?: boolean;
  regionId?: string | null;
  route?: AssignmentRoute;
}): MarkerState {
  if (args.method === 'MANUAL' || args.isOverride) return 'manual';
  if (args.method === 'UNASSIGNED') return 'unassigned';
  if (args.method === 'AUTO' && args.regionId == null) return 'review';
  if (args.route === 'REVIEW_MULTI' || args.route === 'REVIEW_FALLBACK') return 'review';
  if (args.route === 'UNASSIGNED') return 'unassigned';
  return 'auto';
}

export const MARKER_COLORS: Record<MarkerState, string> = {
  auto: '#059669',      // emerald-600
  manual: '#7c3aed',    // violet-600
  review: '#d97706',    // amber-600
  unassigned: '#6b7280', // slate-500
};

export const STATE_LABELS: Record<MarkerState, string> = {
  auto: 'Auto-assigned',
  manual: 'Manual override',
  review: 'Needs review',
  unassigned: 'Unassigned',
};
