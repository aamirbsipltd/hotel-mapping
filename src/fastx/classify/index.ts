// FastX classification pipeline — orchestrator.
//
// Pure function: HotelData (+ mapping dictionary) → ClassifyResult.
// No DB access, no env reads, no network. Phase 2's workbench composes
// this with persistence: load dictionary from DB → call classifyHotel →
// write review decisions back as AmenityMapping rows for the next run.

import type { HotelData } from '../hotelx-types';
import type { CategoryId, BucketId } from '../taxonomy';
import { ORDERED_CATEGORY_IDS, isCategoryId } from '../taxonomy';
import { buildSeedDictionary } from '../mapping/seed';
import { triage } from './triage';
import { lookupExact, type MappingDictionary } from './exact';
import { scoreFuzzy } from './fuzzy';
import { checkExclusions } from './exclusions';
import { FASTX_AUTO_THRESHOLD, FASTX_REVIEW_THRESHOLD } from './thresholds';
import type {
  AmenityItem,
  ClassifiedItem,
  ClassifyResult,
  ClassifyStats,
  RawItem,
} from './types';

export type ClassifyOptions = {
  dictionary?: MappingDictionary;
};

function classifyItem(item: RawItem, dict: MappingDictionary): ClassifiedItem {
  // Pre-bucketed via Stage 0.
  if (item.sourceField === 'cardTypes') {
    return {
      ...item,
      resolvedCategory: '_payment',
      suggestedCategory: null,
      confidence: 1,
      method: 'triage',
      routing: 'excluded',
    };
  }
  if (item.sourceField === 'poi') {
    return {
      ...item,
      resolvedCategory: '_nearby',
      suggestedCategory: null,
      confidence: 1,
      method: 'triage',
      routing: 'excluded',
    };
  }

  // Stage 3 runs first as an override on the raw text — a "Burj Khalifa"
  // string buried inside allAmenities must not reach the amenities pane
  // regardless of any lexicon coincidence.
  const exclusion = checkExclusions(item.rawText);
  if (exclusion) {
    return {
      ...item,
      resolvedCategory: exclusion,
      suggestedCategory: null,
      confidence: 1,
      method: 'exclusion',
      routing: 'excluded',
    };
  }

  // Stage 1.
  const exact = lookupExact(item, dict);
  if (exact) {
    return {
      ...item,
      resolvedCategory: exact.categoryId,
      suggestedCategory: null,
      confidence: 1,
      method: 'exact',
      routing: 'auto',
    };
  }

  // Stage 2.
  const fuzzy = scoreFuzzy(item);
  if (!fuzzy) {
    return {
      ...item,
      resolvedCategory: null,
      suggestedCategory: null,
      confidence: 0,
      method: 'none',
      routing: 'review',
    };
  }

  // Stage 4 — confidence routing.
  if (fuzzy.confidence >= FASTX_AUTO_THRESHOLD) {
    return {
      ...item,
      resolvedCategory: fuzzy.categoryId,
      suggestedCategory: null,
      confidence: fuzzy.confidence,
      method: 'fuzzy',
      routing: 'auto',
    };
  }
  if (fuzzy.confidence >= FASTX_REVIEW_THRESHOLD) {
    return {
      ...item,
      resolvedCategory: null,
      suggestedCategory: fuzzy.categoryId,
      confidence: fuzzy.confidence,
      method: 'fuzzy',
      routing: 'review',
    };
  }
  // Below the review threshold the fuzzy argmax is noise — surface as
  // unclassified rather than dressing it up with a misleading suggestion.
  return {
    ...item,
    resolvedCategory: null,
    suggestedCategory: null,
    confidence: fuzzy.confidence,
    method: 'fuzzy',
    routing: 'review',
  };
}

function emptyCategoryBuckets(): Record<CategoryId, AmenityItem[]> {
  return ORDERED_CATEGORY_IDS.reduce((acc, id) => {
    acc[id] = [];
    return acc;
  }, {} as Record<CategoryId, AmenityItem[]>);
}

function assemble(classified: ClassifiedItem[]): ClassifyResult {
  const categories = emptyCategoryBuckets();
  const payment: AmenityItem[] = [];
  const nearby: AmenityItem[] = [];
  const excluded: AmenityItem[] = [];
  const review: AmenityItem[] = [];
  const all: AmenityItem[] = [];

  for (const c of classified) {
    const item: AmenityItem = { ...c };
    all.push(item);

    if (c.routing === 'auto' && c.resolvedCategory && isCategoryId(c.resolvedCategory)) {
      categories[c.resolvedCategory].push(item);
      continue;
    }
    if (c.routing === 'review') {
      review.push(item);
      continue;
    }
    // routing === 'excluded' — split by bucket.
    const bucket: BucketId | null = c.resolvedCategory;
    if (bucket === '_payment') payment.push(item);
    else if (bucket === '_nearby') nearby.push(item);
    else excluded.push(item);
  }

  const auto = ORDERED_CATEGORY_IDS.reduce((n, id) => n + categories[id].length, 0);
  const stats: ClassifyStats = {
    total: classified.length,
    auto,
    review: review.length,
    excluded: payment.length + nearby.length + excluded.length,
    autoRate: classified.length === 0 ? 0 : auto / classified.length,
  };

  return { categories, payment, nearby, excluded, review, all, stats };
}

export function classifyHotel(
  hotel: HotelData,
  options: ClassifyOptions = {},
): ClassifyResult {
  const dict = options.dictionary ?? buildSeedDictionary();
  const raw = triage(hotel);
  const classified = raw.map((r) => classifyItem(r, dict));
  return assemble(classified);
}

export type { ClassifyResult, AmenityItem, ClassifyStats } from './types';
export { FASTX_AUTO_THRESHOLD, FASTX_REVIEW_THRESHOLD } from './thresholds';
