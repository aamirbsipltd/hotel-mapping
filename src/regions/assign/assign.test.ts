import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRegionIndex,
  assign,
  assignAll,
  FALLBACK_KM,
  type ExistingAssignment,
} from './index';
import { SEED_REGIONS } from '../seed/regions';
import { seedToRegionInput } from '../seed/to-region-input';
import { FIXTURE_HOTELS } from '../fixtures/hotels';
import type { HotelPoint } from '../types';

function buildIndex() {
  return buildRegionIndex(SEED_REGIONS.map(seedToRegionInput));
}

function findHotel(key: string): HotelPoint {
  const h = FIXTURE_HOTELS.find((f) => f.hotelKey === key);
  if (!h) throw new Error(`fixture hotel missing: ${key}`);
  return h;
}

// ── Single-hotel routing ─────────────────────────────────────────────────────

describe('assign() — the four routing guards', () => {
  const index = buildIndex();

  test('guard 1: clean Marina hotel → AUTO dubai-marina', () => {
    const r = assign(findHotel('TGX-DXB-MAR-001'), index);
    assert.equal(r.route, 'AUTO');
    assert.equal(r.regionId, 'dubai-marina');
    assert.equal(r.confidence, 1);
    assert.equal(r.method, 'AUTO');
  });

  test('guard 1: clean JBR hotel → AUTO jbr', () => {
    const r = assign(findHotel('TGX-DXB-JBR-001'), index);
    assert.equal(r.route, 'AUTO');
    assert.equal(r.regionId, 'jbr');
  });

  test('guard 2: Marina↔JBR overlap canary → REVIEW_MULTI, smallest-area suggested (jbr)', () => {
    const r = assign(findHotel('TGX-DXB-MIX-001'), index);
    assert.equal(r.route, 'REVIEW_MULTI');
    assert.equal(r.regionId, null);
    assert.deepEqual(
      [...r.candidateRegionIds].sort(),
      ['dubai-marina', 'jbr'],
    );
    assert.equal(r.suggestedRegionId, 'jbr', 'JBR is smaller-area than Dubai Marina');
    assert.ok(r.confidence > 0 && r.confidence < 1, `multi-match confidence: ${r.confidence}`);
  });

  test('guard 3: hotel sitting just outside any polygon but within FALLBACK_KM → REVIEW_FALLBACK', () => {
    // Synthetic — a point just north of Dubai Marina's bbox by a few hundred
    // metres. Marina's max lat is 25.095; place the hotel at 25.099 so it
    // is clearly outside any polygon but ~0.4 km from the Marina centroid.
    const nudged: HotelPoint = {
      hotelKey: 'TEST-NEAR-MARINA',
      name: 'Near Marina test point',
      lat: 25.099,
      lng: 55.137,
    };
    const r = assign(nudged, index);
    assert.equal(r.route, 'REVIEW_FALLBACK');
    assert.equal(r.regionId, null);
    assert.ok(r.suggestedRegionId, 'fallback should suggest the nearest region');
    assert.ok(r.distanceKm !== null && r.distanceKm > 0 && r.distanceKm < FALLBACK_KM);
    assert.ok(r.confidence > 0 && r.confidence < 1);
  });

  test('guard 4: offshore canary (far from any region) → UNASSIGNED', () => {
    const r = assign(findHotel('TGX-DXB-OFF-001'), index);
    assert.equal(r.route, 'UNASSIGNED');
    assert.equal(r.regionId, null);
    assert.equal(r.suggestedRegionId, null);
    assert.equal(r.confidence, 0);
    assert.ok(r.distanceKm !== null && r.distanceKm > FALLBACK_KM);
  });

  test('Mallorca hotels resolve into their islands\' regions', () => {
    assert.equal(assign(findHotel('TGX-MAL-PDP-001'), index).regionId, 'playa-de-palma');
    assert.equal(assign(findHotel('TGX-MAL-MAG-001'), index).regionId, 'magaluf');
    assert.equal(assign(findHotel('TGX-MAL-SP-001'), index).regionId, 'santa-ponsa');
    assert.equal(assign(findHotel('TGX-MAL-AL-001'), index).regionId, 'alcudia');
    assert.equal(assign(findHotel('TGX-MAL-CM-001'), index).regionId, 'cala-millor');
  });
});

// ── Batch + invariants ───────────────────────────────────────────────────────

describe('assignAll() — batch + stats invariant', () => {
  test('stats invariant: total === auto + manualPreserved + review + unassigned', () => {
    const index = buildIndex();
    const r = assignAll(FIXTURE_HOTELS, index);
    assert.equal(r.stats.total, FIXTURE_HOTELS.length);
    assert.equal(
      r.stats.auto + r.stats.manualPreserved + r.stats.review + r.stats.unassigned,
      r.stats.total,
      `${JSON.stringify(r.stats)} does not reconcile`,
    );
  });

  test('headline canaries land where the brief says they should', () => {
    const index = buildIndex();
    const r = assignAll(FIXTURE_HOTELS, index);
    const overlap = r.assignments.find((a) => a.hotelKey === 'TGX-DXB-MIX-001');
    const offshore = r.assignments.find((a) => a.hotelKey === 'TGX-DXB-OFF-001');
    assert.equal(overlap?.route, 'REVIEW_MULTI');
    assert.equal(offshore?.route, 'UNASSIGNED');
  });

  test('manual overrides survive a re-run (the override-preservation guard)', () => {
    const index = buildIndex();

    // First run, no previous state — engine decides all hotels.
    const first = assignAll(FIXTURE_HOTELS, index);
    const marinaHotel = first.assignments.find((a) => a.hotelKey === 'TGX-DXB-MAR-001');
    assert.equal(marinaHotel?.route, 'AUTO');
    assert.equal(marinaHotel?.regionId, 'dubai-marina');

    // Operator overrides the Marina hotel into JBR.
    const previous = new Map<string, ExistingAssignment>([
      [
        'TGX-DXB-MAR-001',
        {
          hotelKey: 'TGX-DXB-MAR-001',
          regionId: 'jbr',
          method: 'MANUAL',
          isOverride: true,
        },
      ],
    ]);

    const second = assignAll(FIXTURE_HOTELS, index, { previous });

    // The overridden hotel must NOT appear in engine assignments…
    assert.ok(
      !second.assignments.some((a) => a.hotelKey === 'TGX-DXB-MAR-001'),
      'overridden hotel leaked back into engine output',
    );
    // …and must appear in preserved with the manual region intact.
    const kept = second.preserved.find((p) => p.hotelKey === 'TGX-DXB-MAR-001');
    assert.ok(kept, 'overridden hotel missing from preserved');
    assert.equal(kept?.regionId, 'jbr');
    assert.equal(kept?.preservedReason, 'MANUAL');

    // Stats invariant still holds with one fewer engine-decision.
    assert.equal(second.stats.manualPreserved, 1);
    assert.equal(second.stats.auto + 1, first.stats.auto, 'auto count should drop by the preserved override');
    assert.equal(
      second.stats.auto + second.stats.manualPreserved + second.stats.review + second.stats.unassigned,
      second.stats.total,
    );
  });

  test('autoRate denominator excludes manualPreserved', () => {
    const index = buildIndex();
    const previous = new Map<string, ExistingAssignment>([
      [
        'TGX-DXB-OFF-001',
        {
          hotelKey: 'TGX-DXB-OFF-001',
          regionId: 'palm-jumeirah',
          method: 'MANUAL',
          isOverride: true,
        },
      ],
    ]);
    const r = assignAll(FIXTURE_HOTELS, index, { previous });
    const denom = r.stats.total - r.stats.manualPreserved;
    assert.ok(
      Math.abs(r.stats.autoRate - r.stats.auto / denom) < 1e-9,
      `autoRate should be ${r.stats.auto}/${denom}`,
    );
  });

  test('deterministic: same input yields the same assignments and stats', () => {
    const index = buildIndex();
    const a = assignAll(FIXTURE_HOTELS, index);
    const b = assignAll(FIXTURE_HOTELS, index);
    assert.deepEqual(a.stats, b.stats);
    assert.equal(a.assignments.length, b.assignments.length);
    for (let i = 0; i < a.assignments.length; i++) {
      assert.equal(a.assignments[i].hotelKey, b.assignments[i].hotelKey);
      assert.equal(a.assignments[i].route, b.assignments[i].route);
      assert.equal(a.assignments[i].regionId, b.assignments[i].regionId);
      assert.equal(a.assignments[i].suggestedRegionId, b.assignments[i].suggestedRegionId);
    }
  });
});

// ── Realism / autoRate floor ─────────────────────────────────────────────────

describe('assignAll() — realism on the fixture inventory', () => {
  test('autoRate is high (≥0.85) but not 100% on the fixture set', () => {
    const index = buildIndex();
    const r = assignAll(FIXTURE_HOTELS, index);
    assert.ok(
      r.stats.autoRate >= 0.85,
      `autoRate too low: ${r.stats.autoRate} (${JSON.stringify(r.stats)})`,
    );
    assert.ok(
      r.stats.autoRate < 1,
      'expected <100% auto — the two edge-case canaries should never auto',
    );
    assert.ok(r.stats.review >= 1, 'expected at least the overlap canary in review');
    assert.ok(r.stats.unassigned >= 1, 'expected at least the offshore canary unassigned');
  });
});
