// Orchestrates a full assignment run end-to-end.
//
// Reads regions + previous assignments → rebuilds the rbush index from
// scratch (no module-level cache, no staleness window after polygon
// edits) → calls the pure-function assignAll engine → upserts ONLY the
// engine-decided assignments. Manual rows are not in the engine output;
// the loop never touches them.
//
// The post-run audit re-reads the manual rows and asserts byte-identity
// against the snapshot taken at the start. If anything drifted, the
// invariant trips and the run errors before returning.

import 'server-only';
import { prisma } from '@/lib/prisma';
import { assignAll, buildRegionIndex } from '../assign';
import type { AssignmentResult, BatchResult } from '../assign/types';
import { getHotelInventorySource } from '../source';
import {
  loadAssignments,
  loadPreviousMap,
  loadRegions,
  regionsToInputs,
  type DbAssignmentView,
} from './store';

function snapshotManualRows(rows: DbAssignmentView[]): Map<string, string> {
  // Stable serialised snapshot of every manual / override row at start of
  // run. Used to assert nothing in this set changed during persistence.
  const out = new Map<string, string>();
  for (const r of rows) {
    if (r.method === 'MANUAL' || r.isOverride) {
      out.set(
        r.hotelKey,
        JSON.stringify({
          regionId: r.regionId,
          method: r.method,
          isOverride: r.isOverride,
          confidence: r.confidence,
          candidateRegionIds: r.candidateRegionIds,
        }),
      );
    }
  }
  return out;
}

async function upsertAssignment(a: AssignmentResult): Promise<void> {
  const data = {
    regionId: a.regionId,
    method: a.method,
    isOverride: false,
    confidence: a.confidence,
    candidateRegionIds: JSON.stringify(a.candidateRegionIds),
    assignedAt: new Date(),
  };
  await prisma.regionAssignment.upsert({
    where: { hotelKey: a.hotelKey },
    create: { hotelKey: a.hotelKey, ...data },
    update: data,
  });
}

export type RunOutcome = BatchResult & { runId: string };

export async function runAssignAll(): Promise<RunOutcome> {
  const regions = await loadRegions();
  const inputs = regionsToInputs(regions);
  const source = getHotelInventorySource();
  const hotels = await source.listHotels();

  const beforeRows = await loadAssignments();
  const manualSnapshot = snapshotManualRows(beforeRows);
  const previous = await loadPreviousMap();

  const index = buildRegionIndex(inputs);
  const result = assignAll(hotels, index, { previous });

  // Upsert engine-decided rows only. Preserved manual rows are NOT in
  // result.assignments and therefore never touched here.
  for (const a of result.assignments) {
    await upsertAssignment(a);
  }

  // Post-run audit: every manual row that was there at the start must be
  // there now, byte-identical. This is the contract Phase 2 promises.
  const afterRows = await loadAssignments();
  const afterSnapshot = snapshotManualRows(afterRows);
  if (manualSnapshot.size !== afterSnapshot.size) {
    throw new Error(
      `runAssignAll: manual-row count drifted ${manualSnapshot.size} → ${afterSnapshot.size}`,
    );
  }
  for (const [key, before] of manualSnapshot) {
    const after = afterSnapshot.get(key);
    if (after !== before) {
      throw new Error(`runAssignAll: manual row ${key} was modified during the run`);
    }
  }

  const run = await prisma.assignmentRun.create({
    data: { stats: JSON.stringify(result.stats) },
  });

  return { ...result, runId: run.id };
}
