// Canonical amenity taxonomy.
// Stable IDs (kept in lockstep with the AmenityMapping.categoryId column),
// bilingual EN/DE display labels, and lucide-react icon names.
//
// `ORDERED_CATEGORY_IDS` defines the display order on the OTA-style output.
// Non-amenity buckets (`_payment`, `_nearby`, `_excluded`) are listed
// separately — they are emitted by the pipeline but rendered apart from the
// real facilities so the field-separation is visually obvious.

import type { LucideIcon } from 'lucide-react';
import {
  Wifi,
  Waves,
  Sparkles,
  Utensils,
  CarFront,
  Briefcase,
  Baby,
  Accessibility,
  Languages,
  ShieldCheck,
  Building2,
  CreditCard,
  MapPin,
  Trash2,
} from 'lucide-react';

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

type CategoryMeta = {
  id: CategoryId;
  labels: Record<Locale, string>;
  icon: LucideIcon;
};

type BucketMeta = {
  id: BucketId;
  labels: Record<Locale, string>;
  icon: LucideIcon;
  isAmenity: boolean;
};

export const CATEGORIES: Record<CategoryId, CategoryMeta> = {
  internet: {
    id: 'internet',
    labels: { en: 'Internet', de: 'Internet' },
    icon: Wifi,
  },
  pools: {
    id: 'pools',
    labels: { en: 'Pools', de: 'Pools' },
    icon: Waves,
  },
  wellness_spa: {
    id: 'wellness_spa',
    labels: { en: 'Wellness & Spa', de: 'Wellness & Spa' },
    icon: Sparkles,
  },
  food_drink: {
    id: 'food_drink',
    labels: { en: 'Food & Drinks', de: 'Essen & Trinken' },
    icon: Utensils,
  },
  transfers: {
    id: 'transfers',
    labels: { en: 'Transfers', de: 'Transfers' },
    icon: CarFront,
  },
  business: {
    id: 'business',
    labels: { en: 'Business Services', de: 'Business-Services' },
    icon: Briefcase,
  },
  family: {
    id: 'family',
    labels: { en: 'Family Facilities', de: 'Familienangebote' },
    icon: Baby,
  },
  accessibility: {
    id: 'accessibility',
    labels: { en: 'Accessibility', de: 'Barrierefreiheit' },
    icon: Accessibility,
  },
  languages: {
    id: 'languages',
    labels: { en: 'Languages Spoken', de: 'Gesprochene Sprachen' },
    icon: Languages,
  },
  safety_security: {
    id: 'safety_security',
    labels: { en: 'Safety & Security', de: 'Sicherheit & Schutz' },
    icon: ShieldCheck,
  },
  general: {
    id: 'general',
    labels: { en: 'General Facilities', de: 'Allgemeine Einrichtungen' },
    icon: Building2,
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

export const NON_AMENITY_BUCKETS: Record<'_payment' | '_nearby' | '_excluded', BucketMeta> = {
  _payment: {
    id: '_payment',
    labels: { en: 'Accepted Payment', de: 'Akzeptierte Zahlung' },
    icon: CreditCard,
    isAmenity: false,
  },
  _nearby: {
    id: '_nearby',
    labels: { en: "What's Nearby", de: 'In der Umgebung' },
    icon: MapPin,
    isAmenity: false,
  },
  _excluded: {
    id: '_excluded',
    labels: { en: 'Excluded', de: 'Ausgeschlossen' },
    icon: Trash2,
    isAmenity: false,
  },
};

export function bucketLabel(id: BucketId, locale: Locale): string {
  if (id in CATEGORIES) return CATEGORIES[id as CategoryId].labels[locale];
  return NON_AMENITY_BUCKETS[id as '_payment' | '_nearby' | '_excluded'].labels[locale];
}

export function bucketIcon(id: BucketId): LucideIcon {
  if (id in CATEGORIES) return CATEGORIES[id as CategoryId].icon;
  return NON_AMENITY_BUCKETS[id as '_payment' | '_nearby' | '_excluded'].icon;
}

export function isCategoryId(id: string): id is CategoryId {
  return id in CATEGORIES;
}
