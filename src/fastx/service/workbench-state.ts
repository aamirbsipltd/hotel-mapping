// Single GET aggregator — mirrors src/regions/service/workbench-state.ts.
// Loads the latest run for the requested hotel, plus its review items
// (pending and resolved), plus the available source fixtures so the
// workbench can switch hotels without a second round-trip.

import 'server-only';
import { prisma } from '@/lib/prisma';
import type { ClassifyResult, ClassifyStats } from '../classify/types';
import { getFastXSource } from '../source';
import type { FastXSourceListing } from '../source';
import { listReviewItemsForRun, type ReviewItemView } from './store';

export type WorkbenchRun = {
  id: string;
  hotelCode: string;
  hotelName: string | null;
  stats: ClassifyStats;
  result: ClassifyResult;
  createdAt: Date;
  reviewItems: ReviewItemView[];
};

export type WorkbenchState = {
  hotelCode: string | null;
  available: FastXSourceListing[];
  latestRun: WorkbenchRun | null;
};

export async function getWorkbenchState(hotelCode: string | null): Promise<WorkbenchState> {
  const source = getFastXSource();
  const available = await source.listAvailable();

  let latestRun: WorkbenchRun | null = null;
  if (hotelCode) {
    const run = await prisma.classificationRun.findFirst({
      where: { hotelCode },
      orderBy: { createdAt: 'desc' },
    });
    if (run) {
      const reviewItems = await listReviewItemsForRun(run.id);
      latestRun = {
        id: run.id,
        hotelCode: run.hotelCode,
        hotelName: run.hotelName,
        stats: JSON.parse(run.stats) as ClassifyStats,
        result: JSON.parse(run.result) as ClassifyResult,
        createdAt: run.createdAt,
        reviewItems,
      };
    }
  }

  return { hotelCode, available, latestRun };
}
