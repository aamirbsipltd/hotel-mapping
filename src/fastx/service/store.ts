// Service-layer read helpers shared by the API routes and the orchestrator.
// Mirrors src/regions/service/store.ts in shape.
//
// The mapping dictionary the pipeline (Stage 1, exact.ts) consumes is
// built from the seed entries PLUS every AmenityMapping row that's been
// written back from a resolved review item. New supplier codes the
// operator confirms compound the dictionary across hotels — that's the
// "supports future suppliers" claim made real.

import 'server-only';
import { prisma } from '@/lib/prisma';
import type { CategoryId } from '../taxonomy';
import { buildSeedDictionary } from '../mapping/seed';
import type { MappingDictionary } from '../classify/exact';

export type MappingKeyType = 'TGX' | 'GIATA' | 'SUPPLIER' | 'TEXT';

export async function loadMappingDictionary(): Promise<MappingDictionary> {
  const dict = buildSeedDictionary();
  const rows = await prisma.amenityMapping.findMany();
  for (const row of rows) {
    // Stored key is already prefixed (e.g. "SUPPLIER:SHISHA_LOUNGE") so
    // it matches Stage 1's lookup format exactly. See bestKeyFor() below.
    dict.set(row.key, row.categoryId as CategoryId);
  }
  return dict;
}

export type ReviewItemView = {
  id: string;
  runId: string;
  rawText: string;
  sourceField: string;
  suggestedCategoryId: string | null;
  resolvedCategoryId: string | null;
  confidence: number;
  method: string;
  status: 'PENDING' | 'RESOLVED';
  mappingKey: string | null;
  mappingKeyType: MappingKeyType | null;
  createdAt: Date;
  resolvedAt: Date | null;
};

function asView(row: {
  id: string;
  runId: string;
  rawText: string;
  sourceField: string;
  suggestedCategoryId: string | null;
  resolvedCategoryId: string | null;
  confidence: number;
  method: string;
  status: string;
  mappingKey: string | null;
  mappingKeyType: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
}): ReviewItemView {
  return {
    ...row,
    status: row.status as 'PENDING' | 'RESOLVED',
    mappingKeyType: row.mappingKeyType as MappingKeyType | null,
  };
}

export async function listReviewItemsForRun(runId: string): Promise<ReviewItemView[]> {
  const rows = await prisma.reviewItem.findMany({
    where: { runId },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map(asView);
}

export async function getReviewItem(id: string): Promise<ReviewItemView | null> {
  const row = await prisma.reviewItem.findUnique({ where: { id } });
  return row ? asView(row) : null;
}
