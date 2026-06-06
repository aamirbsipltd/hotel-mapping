// Platform integration test.
//
// Five guards (per PLATFORM_INTEGRATION_BRIEF §4):
//
//   1. One canonical hotel — match, location, and content all reference
//      hotelKey TGX-DXB-1001.
//   2. No fourth implementation — each slice equals what its owning
//      module would produce on its own canonical input.
//   3. The coordinate footgun — region resolves to Dubai Marina, AUTO.
//   4. Matcher and region read the same coords.
//   5. Deterministic + keyless — runs in-process, no DB, no env, no
//      network. Two calls return byte-identical views.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { orchestrateCanonical, canonicalHotel } from './orchestrate';
import { getDemoClassification } from '../fastx/demo/compute';
import { buildRegionIndex, assign } from '../regions/assign';
import { SEED_REGIONS } from '../regions/seed/regions';
import { seedToRegionInput } from '../regions/seed/to-region-input';
import { rankCandidates } from '../lib/matching/score';
import { toMatcherCandidate, toMatcherSource } from './adapters/to-matcher';
import { toRegionPoint } from './adapters/to-region';

describe('Platform integration — the spine', () => {
  test('guard 1: one canonical hotel — all three slices reference TGX-DXB-1001', () => {
    const view = orchestrateCanonical();
    assert.equal(view.hotel.key, 'TGX-DXB-1001');
    // FastX content's underlying hotel must be the same fixture.
    const fastx = getDemoClassification('TGX-DXB-1001');
    assert.equal(fastx.hotel.hotelCode, view.hotel.key);
    // Region engine returns the assignment keyed by hotelKey — must match.
    const index = buildRegionIndex(SEED_REGIONS.map(seedToRegionInput));
    const regionDirect = assign(toRegionPoint(canonicalHotel), index);
    assert.equal(regionDirect.hotelKey, view.hotel.key);
  });

  test('guard 2a: FastX slice equals getDemoClassification("TGX-DXB-1001").stats — {28,20,1,4,1,2}', () => {
    const view = orchestrateCanonical();
    const fastx = getDemoClassification('TGX-DXB-1001');
    assert.deepEqual(view.content.stats, fastx.result.stats);
    assert.deepEqual(view.content.stats, {
      total: 28,
      auto: 20,
      review: 1,
      payment: 4,
      nearby: 1,
      excluded: 2,
      autoRate: 20 / 21,
      autoRateDenominator: 21,
    });
    // The full result is referenced, not re-derived.
    assert.equal(view.content.result, fastx.result);
  });

  test('guard 2b: region slice equals what assign() returns on the same input', () => {
    const view = orchestrateCanonical();
    const index = buildRegionIndex(SEED_REGIONS.map(seedToRegionInput));
    const direct = assign(toRegionPoint(canonicalHotel), index);
    assert.equal(view.location.route, direct.route);
    assert.equal(view.location.regionSlug, 'dubai-marina');
    // The direct call's regionId is the indexed region's id; the
    // platform exposes the slug derived from that.
    const region = index.regions.find((r) => r.id === direct.regionId);
    assert.equal(region?.slug, view.location.regionSlug);
  });

  test('guard 2c: matcher slice equals rankCandidates() on the same input', () => {
    const view = orchestrateCanonical();
    const source = toMatcherSource(canonicalHotel);
    const candidate = toMatcherCandidate(canonicalHotel.mockGooglePlace);
    const ranked = rankCandidates(source, [candidate]);
    assert.equal(view.match.placeId, ranked[0].candidate.locationId);
    assert.equal(view.match.confidence, ranked[0].breakdown.totalScore);
    assert.equal(view.match.signals.nameScore, ranked[0].breakdown.nameScore);
    assert.equal(view.match.signals.addressScore, ranked[0].breakdown.addressScore);
    assert.equal(view.match.signals.distanceScore, ranked[0].breakdown.distanceScore);
    assert.equal(view.match.signals.phoneMatch, ranked[0].breakdown.phoneMatch);
  });

  test('guard 3: coords land inside Dubai Marina (AUTO), not the JBR overlap strip', () => {
    const view = orchestrateCanonical();
    assert.equal(view.location.route, 'AUTO');
    assert.equal(view.location.region, 'Dubai Marina');
    assert.equal(view.location.regionSlug, 'dubai-marina');
    assert.equal(view.location.destination, 'Dubai');
    assert.equal(view.location.country, 'United Arab Emirates');
    assert.equal(view.location.confidence, 1);
    // Sanity: the canonical coords are west of JBR's western edge (55.145).
    assert.ok(canonicalHotel.coords.lng < 55.145, 'canonical coords must avoid the Marina↔JBR overlap strip');
  });

  test('guard 3b: matcher classifies the mock Google Place as auto_accept', () => {
    const view = orchestrateCanonical();
    assert.equal(view.match.classification, 'auto_accept');
    assert.ok(
      view.match.confidence >= 0.85,
      `expected ≥0.85, got ${view.match.confidence}`,
    );
    assert.equal(view.match.signals.phoneMatch, true);
    // Mock Place is ~20 m away — well inside the distance score cliff.
    assert.ok(view.match.distanceKm !== null && view.match.distanceKm < 0.1);
  });

  test('guard 4: matcher source and region point read the same coords', () => {
    const source = toMatcherSource(canonicalHotel);
    const point = toRegionPoint(canonicalHotel);
    assert.equal(source.latitude, point.lat);
    assert.equal(source.longitude, point.lng);
    assert.equal(source.latitude, canonicalHotel.coords.lat);
    assert.equal(source.longitude, canonicalHotel.coords.lng);
  });

  test('guard 5: deterministic + keyless — two calls return identical views', () => {
    const a = orchestrateCanonical();
    const b = orchestrateCanonical();
    // Match, location, content stats — same numbers, same references where
    // the underlying compute is cached.
    assert.deepEqual(a.match, b.match);
    assert.deepEqual(a.location, b.location);
    assert.deepEqual(a.content.stats, b.content.stats);
    // The FastX result is memoised — same reference identity.
    assert.equal(a.content.result, b.content.result);
  });
});
