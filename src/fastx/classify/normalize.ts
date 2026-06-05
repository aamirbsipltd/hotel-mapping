// Text normalisation shared across the pipeline stages.
//
// `tokenize` reuses the hotel matcher's tokenizer (diacritic strip,
// stopword filter, punctuation flatten) so amenities and hotel names go
// through the same pre-processing — keeps similarity scores comparable.

import { tokenize } from '@/lib/matching/name-similarity';

export function normaliseText(s: string): string {
  return tokenize(s).join(' ');
}

// Stable key for the exact-map TEXT branch: tokenize, sort, join. Sorting
// makes order-insensitive (so "rooftop pool" and "pool rooftop" collide).
export function normaliseKey(s: string): string {
  return [...new Set(tokenize(s))].sort().join(' ');
}

export function nonEmpty(s: string | undefined | null): s is string {
  return typeof s === 'string' && s.trim().length > 0;
}
