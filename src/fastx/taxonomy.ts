// Canonical amenity taxonomy — pure data and types only. Lucide icon
// bindings live in `taxonomy-icons.ts` so this file stays React-free and
// importable from server-only / test contexts.

export type CategoryId =
  | 'internet'
  | 'pools'
  | 'wellness_spa'
  | 'food_drink'
  | 'transfers'
  | 'business'
  | 'family'
  | 'accessibility'
  | 'languages'
  | 'safety_security'
  | 'general';

export type BucketId = CategoryId | '_payment' | '_nearby' | '_excluded';

export type Locale = 'en' | 'de';

export type CategoryMeta = {
  id: CategoryId;
  labels: Record<Locale, string>;
};

export type BucketMeta = {
  id: BucketId;
  labels: Record<Locale, string>;
  isAmenity: boolean;
};

export const CATEGORIES: Record<CategoryId, CategoryMeta> = {
  internet: { id: 'internet', labels: { en: 'Internet', de: 'Internet' } },
  pools: { id: 'pools', labels: { en: 'Pools', de: 'Pools' } },
  wellness_spa: {
    id: 'wellness_spa',
    labels: { en: 'Wellness & Spa', de: 'Wellness & Spa' },
  },
  food_drink: {
    id: 'food_drink',
    labels: { en: 'Food & Drinks', de: 'Essen & Trinken' },
  },
  transfers: { id: 'transfers', labels: { en: 'Transfers', de: 'Transfers' } },
  business: {
    id: 'business',
    labels: { en: 'Business Services', de: 'Business-Services' },
  },
  family: {
    id: 'family',
    labels: { en: 'Family Facilities', de: 'Familienangebote' },
  },
  accessibility: {
    id: 'accessibility',
    labels: { en: 'Accessibility', de: 'Barrierefreiheit' },
  },
  languages: {
    id: 'languages',
    labels: { en: 'Languages Spoken', de: 'Gesprochene Sprachen' },
  },
  safety_security: {
    id: 'safety_security',
    labels: { en: 'Safety & Security', de: 'Sicherheit & Schutz' },
  },
  general: {
    id: 'general',
    labels: { en: 'General Facilities', de: 'Allgemeine Einrichtungen' },
  },
};

export const ORDERED_CATEGORY_IDS: CategoryId[] = [
  'internet',
  'pools',
  'wellness_spa',
  'food_drink',
  'transfers',
  'business',
  'family',
  'accessibility',
  'languages',
  'safety_security',
  'general',
];

export const NON_AMENITY_BUCKETS: Record<
  '_payment' | '_nearby' | '_excluded',
  BucketMeta
> = {
  _payment: {
    id: '_payment',
    labels: { en: 'Accepted Payment', de: 'Akzeptierte Zahlung' },
    isAmenity: false,
  },
  _nearby: {
    id: '_nearby',
    labels: { en: "What's Nearby", de: 'In der Umgebung' },
    isAmenity: false,
  },
  _excluded: {
    id: '_excluded',
    labels: { en: 'Excluded', de: 'Ausgeschlossen' },
    isAmenity: false,
  },
};

export function bucketLabel(id: BucketId, locale: Locale): string {
  if (id in CATEGORIES) return CATEGORIES[id as CategoryId].labels[locale];
  return NON_AMENITY_BUCKETS[id as '_payment' | '_nearby' | '_excluded'].labels[locale];
}

export function isCategoryId(id: string): id is CategoryId {
  return id in CATEGORIES;
}
