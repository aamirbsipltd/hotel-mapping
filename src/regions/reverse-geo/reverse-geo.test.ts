import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { MockReverseGeocoder, LiveReverseGeocoder, type ReverseGeocodeResult } from './index';
import { buildRegionIndex } from '../assign';
import { SEED_REGIONS } from '../seed/regions';
import { seedToRegionInput } from '../seed/to-region-input';

const index = buildRegionIndex(SEED_REGIONS.map(seedToRegionInput));

describe('MockReverseGeocoder — nearest-centroid', () => {
  test('suggests the nearest seed region for a Dubai Marina coordinate', async () => {
    const geo = new MockReverseGeocoder(index.regions);
    const r = await geo.reverseGeocode(25.078, 55.138);
    assert.equal(r.kind, 'SUGGESTION');
    if (r.kind === 'SUGGESTION') {
      assert.equal(r.suggestion.regionId, 'dubai-marina');
      assert.equal(r.suggestion.via, 'NEAREST_CENTROID');
      assert.ok(r.suggestion.distanceKm < 1);
      assert.ok(r.suggestion.confidence > 0.95);
    }
  });

  test('returns NONE when no centroid sits inside the suggest radius', async () => {
    const geo = new MockReverseGeocoder(index.regions);
    // Mid-Atlantic, thousands of kilometres from anything seeded.
    const r = await geo.reverseGeocode(0, -30);
    assert.equal(r.kind, 'NONE');
  });

  test('returns NONE when the region list is empty', async () => {
    const geo = new MockReverseGeocoder([]);
    const r = await geo.reverseGeocode(25.078, 55.138);
    assert.equal(r.kind, 'NONE');
  });
});

describe('reverse-geocode — suggestion-only by construction', () => {
  test('result type has no AUTO discriminator (compile-time check)', () => {
    // If someone adds an AUTO member to ReverseGeocodeResult in a future
    // refactor, this constant's exhaustiveness check below will not
    // compile — failing the build, not just a runtime test.
    const sample: ReverseGeocodeResult = { kind: 'NONE', reason: 'X' };
    let visited = '';
    switch (sample.kind) {
      case 'NONE':
        visited = 'none';
        break;
      case 'SUGGESTION':
        visited = 'suggestion';
        break;
      default: {
        // exhaustiveness — compile error if a new variant lands.
        const _exhaustive: never = sample;
        void _exhaustive;
        visited = 'unreachable';
      }
    }
    assert.equal(visited, 'none');
    // Runtime: the only two kinds are NONE and SUGGESTION.
    const kinds = new Set(['NONE', 'SUGGESTION']);
    assert.ok(kinds.has(sample.kind));
  });

  test('every result the mock can return is a suggestion or nothing — never an assignment', async () => {
    const geo = new MockReverseGeocoder(index.regions);
    for (const [lat, lng] of [
      [25.078, 55.138],
      [39.51, 2.74],
      [0, 0],
      [80, 0],
      [-89, 179],
    ]) {
      const r = await geo.reverseGeocode(lat, lng);
      assert.ok(r.kind === 'NONE' || r.kind === 'SUGGESTION', `unexpected kind: ${r.kind}`);
      // A suggestion never carries enough to short-circuit review.
      if (r.kind === 'SUGGESTION') {
        // The shape literally cannot carry 'AUTO' — assert via key presence.
        assert.ok(!('route' in r.suggestion), 'suggestion should not carry a route');
        assert.ok(!('method' in r.suggestion), 'suggestion should not carry a method');
      }
    }
  });
});

describe('LiveReverseGeocoder', () => {
  test('is a stub — throws unless wired', async () => {
    const geo = new LiveReverseGeocoder();
    await assert.rejects(() => geo.reverseGeocode(25, 55), /stub/i);
  });
});
