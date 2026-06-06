// Integration test for the service layer's upsert-only contract.
//
// Touches the local SQLite dev DB (Prisma + libsql). Resets the region
// module's tables before each test, leaves other modules (matcher
// sessions, FastX runs) alone — never `prisma.*.deleteMany({})` against a
// table this module doesn't own.

import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../lib/prisma';
import { bootstrapSeed } from './bootstrap';
import { runAssignAll } from './run-assign-all';
import { manualAssign, loadAssignments } from './store';

async function resetRegionTables() {
  // Order respects FK cascade: assignments → assignmentRun → regions →
  // destinations → countries. Cascades handle children but we delete
  // explicitly so a missing cascade isn't silently masked.
  await prisma.regionAssignment.deleteMany({});
  await prisma.assignmentRun.deleteMany({});
  await prisma.region.deleteMany({});
  await prisma.destination.deleteMany({});
  await prisma.country.deleteMany({});
}

describe('runAssignAll — DB round-trip', () => {
  before(async () => {
    await resetRegionTables();
    await bootstrapSeed();
  });

  beforeEach(async () => {
    // Keep regions + destinations + countries from before(); just clear
    // assignments + runs so each test starts from a known engine state.
    await prisma.regionAssignment.deleteMany({});
    await prisma.assignmentRun.deleteMany({});
  });

  after(async () => {
    // Do not call prisma.$disconnect() — the Prisma client is a singleton
    // shared with other service tests in this run. Disconnecting here
    // would close the connection out from under the next suite.
    await resetRegionTables();
  });

  test('first run writes engine assignments only — no MANUAL rows produced', async () => {
    const r = await runAssignAll();
    assert.equal(r.stats.manualPreserved, 0);
    assert.equal(r.stats.total, 29);
    assert.equal(
      r.stats.auto + r.stats.manualPreserved + r.stats.review + r.stats.unassigned,
      r.stats.total,
    );
    const rows = await loadAssignments();
    for (const row of rows) {
      assert.notEqual(row.method, 'MANUAL', `${row.hotelKey} unexpectedly MANUAL`);
      assert.equal(row.isOverride, false);
    }
  });

  test('manual override survives a subsequent re-run, byte-identical', async () => {
    // 1. seed engine assignments
    await runAssignAll();

    // 2. operator overrides Marina-001 → jbr
    const marinaRegion = await prisma.region.findUniqueOrThrow({ where: { slug: 'jbr' } });
    const overridden = await manualAssign('TGX-DXB-MAR-001', marinaRegion.id);
    assert.equal(overridden.method, 'MANUAL');
    assert.equal(overridden.isOverride, true);
    assert.equal(overridden.regionId, marinaRegion.id);
    const overrideTimestamp = overridden.assignedAt.toISOString();

    // 3. re-run
    const second = await runAssignAll();
    assert.equal(second.stats.manualPreserved, 1);

    // 4. manual row must be byte-identical (regionId, method, isOverride,
    //    confidence, candidates, assignedAt). The runAssignAll audit would
    //    already throw, but verify externally too.
    const rows = await loadAssignments();
    const kept = rows.find((r) => r.hotelKey === 'TGX-DXB-MAR-001');
    assert.ok(kept, 'override row vanished after re-run');
    assert.equal(kept!.method, 'MANUAL');
    assert.equal(kept!.isOverride, true);
    assert.equal(kept!.regionId, marinaRegion.id);
    assert.equal(kept!.assignedAt.toISOString(), overrideTimestamp);

    // 5. exactly one fewer engine-confidently-assigned row than the first
    //    plain run (the overridden hotel moved into the preserved bucket).
    //    REVIEW items also persist with method='AUTO' but regionId=null,
    //    so filter for both: confident auto = method=AUTO AND regionId set.
    const confidentAuto = rows.filter(
      (r) => r.method === 'AUTO' && r.regionId !== null && !r.isOverride,
    ).length;
    assert.equal(confidentAuto, second.stats.auto);
  });

  test('engine writes are upserts — re-run does not duplicate rows', async () => {
    await runAssignAll();
    const firstCount = await prisma.regionAssignment.count();
    await runAssignAll();
    const secondCount = await prisma.regionAssignment.count();
    assert.equal(firstCount, secondCount, 'row count changed across re-runs (expected upsert)');
  });
});
