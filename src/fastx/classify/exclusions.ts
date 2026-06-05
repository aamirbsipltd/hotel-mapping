// Stage 3 — exclusion rules.
//
// Backstop for the cases where a non-amenity slips past Stage 0 triage
// because it's authored inside the allAmenities list rather than its own
// HotelData field. Three classes:
//   • payment tokens   → _payment
//   • POI / landmark   → _nearby
//   • metadata junk    → _excluded
// Exclusions OVERRIDE Stage 1/2 hits — that's the whole point: even if
// the lexicon claims "lounge" matches food_drink, a "Burj Khalifa" string
// is not an amenity.

import type { BucketId } from '../taxonomy';
import { tokenize } from '@/lib/matching/name-similarity';

const PAYMENT_TOKENS = new Set([
  'visa', 'mastercard', 'amex', 'maestro', 'diners', 'discover',
  'jcb', 'unionpay', 'cash',
  'vi', 'mc', 'ax', 'di', 'jc', // common short codes from cardTypes
]);

const PAYMENT_PHRASES = [
  ['credit', 'card'],
  ['debit', 'card'],
  ['accepted', 'payment'],
];

// Common Dubai landmarks plus generic landmark-shaped keywords. The
// suffix list catches the "X Mall / Y Tower / Z Museum" pattern that
// covers most cities without an exhaustive place-name list.
const LANDMARK_TOKENS = new Set([
  'burj', 'khalifa', 'mall', 'fountain', 'tower', 'museum',
  'cathedral', 'palace', 'square', 'park', 'beach', 'promenade',
  'altstadt', 'kunstmuseum',
]);

const DISTANCE_REGEX = /(^|\s)(\d+(\.\d+)?)\s?(km|m|mi|miles?|metres?|meter)\b/i;

const SUPPLIER_NOISE_TOKENS = new Set([
  'supplier', 'code', 'internal', 'note', 'reserved',
]);

function hasAnyToken(tokens: string[], set: Set<string>): boolean {
  for (const t of tokens) if (set.has(t)) return true;
  return false;
}

function hasPhrase(tokens: string[], phrase: string[]): boolean {
  if (phrase.length === 0 || tokens.length < phrase.length) return false;
  const target = new Set(phrase);
  let hits = 0;
  for (const t of tokens) if (target.has(t)) hits++;
  return hits === target.size;
}

export function checkExclusions(rawText: string): BucketId | null {
  if (!rawText) return '_excluded';
  const trimmed = rawText.trim();
  if (!trimmed) return '_excluded';

  // numeric-only or short opaque codes
  if (/^[0-9]+$/.test(trimmed)) return '_excluded';
  if (/^[A-Z0-9_-]{1,5}$/.test(trimmed) && /\d/.test(trimmed)) {
    // SUPPLIER_CODE_4471 → caught by the phrase rule below; here we drop
    // single-token gibberish like "X4471" with mixed alphanumerics.
    return '_excluded';
  }

  const tokens = tokenize(trimmed);
  if (tokens.length === 0) return '_excluded';

  // Supplier metadata / internal notes
  if (hasAnyToken(tokens, SUPPLIER_NOISE_TOKENS)) {
    if (
      hasPhrase(tokens, ['supplier', 'code']) ||
      hasPhrase(tokens, ['internal', 'note']) ||
      tokens.every((t) => SUPPLIER_NOISE_TOKENS.has(t) || /^[0-9]+$/.test(t))
    ) {
      return '_excluded';
    }
  }

  // Distance phrase ("1.2 km") is a near-certain POI marker.
  if (DISTANCE_REGEX.test(trimmed)) return '_nearby';

  // Landmark vocabulary
  if (hasAnyToken(tokens, LANDMARK_TOKENS)) return '_nearby';

  // Payment vocabulary
  if (hasAnyToken(tokens, PAYMENT_TOKENS)) return '_payment';
  for (const phrase of PAYMENT_PHRASES) {
    if (hasPhrase(tokens, phrase)) return '_payment';
  }

  return null;
}
