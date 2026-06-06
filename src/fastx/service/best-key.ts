// Pick the most stable persisted key for a learned mapping.
//
// Stage 1 (src/fastx/classify/exact.ts) resolves the dictionary in
// priority order TGX code → GIATA → supplier code → normalised text.
// The persisted AmenityMapping row MUST use the same key Stage 1 will
// look up on the next run, prefixed with its keyType, or the learning
// loop fails silently (no row hit, item stays in review forever).
//
// Pure function so the service layer and the tests both exercise it.

import { normaliseKey } from '../classify/normalize';

export type KeyCandidates = {
  canonicalCode?: string;  // amenityData.code  → TGX
  giataCode?: string;      // mappings[GIATA].code → GIATA
  supplierCode?: string;   // amenityData.amenityCode → SUPPLIER
  rawText: string;         // last resort → TEXT (normalised)
};

export type KeyType = 'TGX' | 'GIATA' | 'SUPPLIER' | 'TEXT';

export type BestKey = {
  key: string;        // bare key, e.g. "SHISHA_LOUNGE"
  keyType: KeyType;
  storageKey: string; // prefixed for dictionary lookup, e.g. "SUPPLIER:SHISHA_LOUNGE"
};

export function bestKeyFor(c: KeyCandidates): BestKey | null {
  if (c.canonicalCode) {
    return {
      key: c.canonicalCode,
      keyType: 'TGX',
      storageKey: `TGX:${c.canonicalCode}`,
    };
  }
  if (c.giataCode) {
    return {
      key: c.giataCode,
      keyType: 'GIATA',
      storageKey: `GIATA:${c.giataCode}`,
    };
  }
  if (c.supplierCode) {
    return {
      key: c.supplierCode,
      keyType: 'SUPPLIER',
      storageKey: `SUPPLIER:${c.supplierCode}`,
    };
  }
  const norm = normaliseKey(c.rawText);
  if (!norm) return null;
  return { key: norm, keyType: 'TEXT', storageKey: `TEXT:${norm}` };
}
