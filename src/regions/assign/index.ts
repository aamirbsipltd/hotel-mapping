// Public surface of the region-assignment engine.

export { assign, type AssignOptions } from './assign';
export { assignAll, type AssignAllOptions } from './assign-all';
export { buildRegionIndex, RegionIndex } from './geo-index';
export { FALLBACK_KM } from './thresholds';
export type {
  RegionInput,
  IndexedRegion,
  AssignmentRoute,
  AssignmentMethod,
  AssignmentResult,
  ExistingAssignment,
  PreservedAssignment,
  AssignmentStats,
  BatchResult,
} from './types';
