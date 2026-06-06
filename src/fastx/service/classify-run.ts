// Classify a hotel and persist the run + its review items.
//
// Mirrors src/regions/service/run-assign-all.ts:
//   • Single orchestrator that reads, calls the pure pipeline, writes.
//   • Loads the full mapping dictionary fresh each call — no module-level
//     cache, so a freshly approved AmenityMapping row is reflected in
//     the next classify call.
//   • Persists exactly one ClassificationRun + one ReviewItem per item
//     in result.review (those with routing='review').
//
// ReviewItem.mappingKey / mappingKeyType are populated at create time
// from bestKeyFor() — Stage 1 will look up that exact storage key on
// the next run, which is how the write-back loop fires.

import 'server-only';
import { prisma } from '@/lib/prisma';
import type { HotelData } from '../hotelx-types';
import { classifyHotel } from '../classify';
import type { AmenityItem, ClassifyResult } from '../classify/types';
import { getFastXSource } from '../source';
import { loadMappingDictionary } from './store';
import { bestKeyFor } from './best-key';

export type RunOutcome = {
  runId: string;
  result: ClassifyResult;
};

function reviewItemCreateData(item: AmenityItem) {
  const candidates = bestKeyFor({
    canonicalCode: item.canonicalCode,
    giataCode: item.giataCode,
    supplierCode: item.supplierCode,
    rawText: item.rawText,
  });
  return {
    rawText: item.rawText,
    sourceField: item.sourceField,
    suggestedCategoryId: item.suggestedCategory,
    resolvedCategoryId: null,
    confidence: item.confidence,
    method: item.method,
    status: 'PENDING' as const,
    mappingKey: candidates?.key ?? null,
    mappingKeyType: candidates?.keyType ?? null,
  };
}

export async function classifyAndPersist(
  hotel: HotelData,
): Promise<RunOutcome> {
  const dictionary = await loadMappingDictionary();
  const result = classifyHotel(hotel, { dictionary });

  const run = await prisma.classificationRun.create({
    data: {
      hotelCode: hotel.hotelCode,
      hotelName: hotel.hotelName ?? null,
      stats: JSON.stringify(result.stats),
      // Snapshot the full categorised result at run-create time. The
      // workbench renders from this snapshot so resolving a review
      // item (which mutates the dictionary) does not desync the stats
      // panel from the per-item table. "Re-classify" creates a new
      // run with a fresh snapshot.
      result: JSON.stringify(result),
      reviewItems: {
        create: result.review.map(reviewItemCreateData),
      },
    },
  });

  return { runId: run.id, result };
}

export async function classifyByHotelCode(hotelCode: string): Promise<RunOutcome> {
  const source = getFastXSource();
  const hotel = await source.getHotelContent(hotelCode);
  return classifyAndPersist(hotel);
}
