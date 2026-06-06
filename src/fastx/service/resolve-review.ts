// Resolve a review item — the learning step.
//
// 1. Read the ReviewItem to find the persisted storage key (populated at
//    create time from bestKeyFor()).
// 2. Upsert an AmenityMapping row keyed by that exact storage key, with
//    source='REVIEW' — so Stage 1's lookup on the next classify run
//    will hit. Upsert, not delete-and-reinsert; idempotent.
// 3. Mark the ReviewItem RESOLVED with the chosen category.
//
// Mirrors src/regions/service/store.ts → manualAssign's discipline:
//   • upsert by unique key, never delete-then-insert
//   • the contract is "applying the same decision twice is a no-op"

import 'server-only';
import { prisma } from '@/lib/prisma';
import { isCategoryId, type CategoryId } from '../taxonomy';
import type { MappingKeyType } from './store';

export type ResolveOutcome = {
  resolved: true;
  reviewItemId: string;
  storageKey: string;
  keyType: MappingKeyType;
  categoryId: CategoryId;
};

export async function resolveReviewItem(
  reviewItemId: string,
  categoryId: string,
): Promise<ResolveOutcome> {
  if (!isCategoryId(categoryId)) {
    throw new Error(`resolveReviewItem: unknown categoryId "${categoryId}"`);
  }

  const review = await prisma.reviewItem.findUnique({ where: { id: reviewItemId } });
  if (!review) {
    throw new Error(`resolveReviewItem: review item ${reviewItemId} not found`);
  }
  if (!review.mappingKey || !review.mappingKeyType) {
    // bestKeyFor() returned null at create time — no stable identifier
    // for this raw text. We can't make the next run hit Stage 1, but we
    // can still record the operator's decision against this single item.
    await prisma.reviewItem.update({
      where: { id: reviewItemId },
      data: {
        status: 'RESOLVED',
        resolvedCategoryId: categoryId,
        resolvedAt: new Date(),
      },
    });
    throw new Error(
      `resolveReviewItem: review item ${reviewItemId} has no stable key; recorded the decision but Stage 1 cannot key it`,
    );
  }

  const keyType = review.mappingKeyType as MappingKeyType;
  const storageKey = `${keyType}:${review.mappingKey}`;

  // Upsert the learning row. Re-resolving the same item is a no-op on
  // both tables.
  await prisma.amenityMapping.upsert({
    where: { key: storageKey },
    create: {
      key: storageKey,
      keyType,
      categoryId,
      source: 'REVIEW',
    },
    update: {
      categoryId,
    },
  });

  await prisma.reviewItem.update({
    where: { id: reviewItemId },
    data: {
      status: 'RESOLVED',
      resolvedCategoryId: categoryId,
      resolvedAt: new Date(),
    },
  });

  return {
    resolved: true,
    reviewItemId,
    storageKey,
    keyType,
    categoryId,
  };
}
