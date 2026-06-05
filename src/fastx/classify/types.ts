import type { ApplicationAreaType } from '../hotelx-types';
import type { CategoryId, BucketId, Locale } from '../taxonomy';

export type SourceField = 'amenity' | 'cardTypes' | 'poi';

export type ClassifyMethod =
  | 'triage'     // pre-bucketed via Stage 0 (cardTypes / poi)
  | 'exact'      // Stage 1 dictionary hit
  | 'fuzzy'      // Stage 2 lexicon scoring
  | 'exclusion'  // Stage 3 override fired
  | 'none';      // no lexicon match at all

export type Routing = 'auto' | 'review' | 'excluded';

// Stage 0 output — a normalised row per input field.
export type RawItem = {
  rawText: string;
  texts: Partial<Record<Locale, string>>; // bilingual text where present
  canonicalCode?: string;     // amenityData.code (TGX)
  supplierCode?: string;      // amenityData.amenityCode
  giataCode?: string;         // amenityData.mappings[context=GIATA].code
  applicationType?: ApplicationAreaType;
  sourceField: SourceField;
};

// Final classified row — what the result aggregator consumes.
export type ClassifiedItem = RawItem & {
  resolvedCategory: BucketId | null;
  suggestedCategory: CategoryId | null;
  confidence: number;
  method: ClassifyMethod;
  routing: Routing;
};

// Output shape consumed by the workbench and OTA renderer.
export type AmenityItem = {
  rawText: string;
  texts: Partial<Record<Locale, string>>;
  canonicalCode?: string;
  supplierCode?: string;
  giataCode?: string;
  applicationType?: ApplicationAreaType;
  sourceField: SourceField;
  resolvedCategory: BucketId | null;
  suggestedCategory: CategoryId | null;
  confidence: number;
  method: ClassifyMethod;
  routing: Routing;
};

export type ClassifyStats = {
  total: number;
  auto: number;
  review: number;
  excluded: number;
  autoRate: number; // auto / (auto + review + excluded), 0..1
};

export type ClassifyResult = {
  categories: Record<CategoryId, AmenityItem[]>;
  payment: AmenityItem[];
  nearby: AmenityItem[];
  excluded: AmenityItem[];
  review: AmenityItem[];
  all: AmenityItem[]; // every item in source order — for the workbench table
  stats: ClassifyStats;
};
