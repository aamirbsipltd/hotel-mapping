// Bilingual label resolution.
//
// Category labels come from src/fastx/taxonomy.ts — a curated EN+DE
// dictionary keyed by canonical category ID. Amenity item names come
// from amenityData.texts in the source (HotelX returns both languages
// where the supplier authored them); fall back to the other locale
// when one is missing rather than machine-translating. Place names
// (`_nearby`) and payment codes (`_payment`) are typically the same
// across languages so the fallback chain works without curation.

import { CATEGORIES, NON_AMENITY_BUCKETS, type BucketId, type CategoryId, type Locale } from '../taxonomy';
import type { AmenityItem } from '../classify/types';

export function categoryLabel(id: CategoryId, locale: Locale): string {
  return CATEGORIES[id].labels[locale];
}

export function bucketLabel(id: BucketId, locale: Locale): string {
  if (id in CATEGORIES) return CATEGORIES[id as CategoryId].labels[locale];
  return NON_AMENITY_BUCKETS[id as '_payment' | '_nearby' | '_excluded'].labels[locale];
}

// Resolves an amenity's displayed name for the requested locale, falling
// back through the available text fields. Never returns empty — the
// rawText (which Phase 0 triage sets to the EN text, supplier code, or
// canonical code) is the last resort. Curated, not machine-translated.
export function amenityLabel(item: AmenityItem, locale: Locale): string {
  const direct = item.texts[locale];
  if (direct && direct.trim()) return direct;
  const other: Locale = locale === 'en' ? 'de' : 'en';
  const fallback = item.texts[other];
  if (fallback && fallback.trim()) return fallback;
  return item.rawText || '';
}
