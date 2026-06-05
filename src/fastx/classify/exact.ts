// Stage 1 — exact map.
//
// Looks the item up against the seed dictionary (and, in Phase 2, against
// the AmenityMapping rows the review queue has appended). Resolution order:
// TGX canonical code → GIATA code → supplier code → normalised text key.
// First hit wins.

import type { CategoryId } from '../taxonomy';
import { normaliseKey } from './normalize';
import type { RawItem } from './types';

export type MappingDictionary = Map<string, CategoryId>;

export type ExactHit = {
  categoryId: CategoryId;
  matchedKey: string;
  matchedKeyType: 'TGX' | 'GIATA' | 'SUPPLIER' | 'TEXT';
};

export function lookupExact(
  item: RawItem,
  dict: MappingDictionary,
): ExactHit | null {
  if (item.canonicalCode) {
    const k = `TGX:${item.canonicalCode}`;
    const hit = dict.get(k);
    if (hit) return { categoryId: hit, matchedKey: item.canonicalCode, matchedKeyType: 'TGX' };
  }
  if (item.giataCode) {
    const k = `GIATA:${item.giataCode}`;
    const hit = dict.get(k);
    if (hit) return { categoryId: hit, matchedKey: item.giataCode, matchedKeyType: 'GIATA' };
  }
  if (item.supplierCode) {
    const k = `SUPPLIER:${item.supplierCode}`;
    const hit = dict.get(k);
    if (hit) return { categoryId: hit, matchedKey: item.supplierCode, matchedKeyType: 'SUPPLIER' };
  }
  if (item.rawText) {
    const norm = normaliseKey(item.rawText);
    if (norm) {
      const k = `TEXT:${norm}`;
      const hit = dict.get(k);
      if (hit) return { categoryId: hit, matchedKey: norm, matchedKeyType: 'TEXT' };
    }
  }
  return null;
}
