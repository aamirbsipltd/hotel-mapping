import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { clearDemoCache, getDemoResult } from './compute';
import {
  combinedRegionBbox,
  expandBbox,
  makeProjection,
  pointInBbox,
  polygonToSvgPath,
} from './projection';

describe('demo compute', () => {
  test('is deterministic and matches the headline counts', () => {
    clearDemoCache();
    const a = getDemoResult();
    const b = getDemoResult();
    assert.equal(a, b, 'expected the cached result to be the same instance');
    assert.deepEqual(a.result.stats, {
      total: 29,
      auto: 27,
      manualPreserved: 0,
      review: 1,
      unassigned: 1,
      autoRate: 27 / 29,
    });
  });

  test('exposes regions and hotels for downstream renderers', () => {
    clearDemoCache();
    const { regions, hotels } = getDemoResult();
    assert.equal(regions.length, 12);
    assert.equal(hotels.length, 29);
  });
});

describe('projection helpers', () => {
  test('combinedRegionBbox encloses every region', () => {
    const { regions } = getDemoResult();
    const bbox = combinedRegionBbox(regions);
    for (const r of regions) {
      assert.ok(r.minLng >= bbox.minLng);
      assert.ok(r.minLat >= bbox.minLat);
      assert.ok(r.maxLng <= bbox.maxLng);
      assert.ok(r.maxLat <= bbox.maxLat);
    }
  });

  test('makeProjection puts the bbox corners on the canvas corners (within padding)', () => {
    const bbox = { minLng: 0, minLat: 0, maxLng: 1, maxLat: 1 };
    const project = makeProjection(bbox, 100, 100, 0);
    assert.deepEqual(project(0, 1), [0, 0]); // top-left
    assert.deepEqual(project(1, 0), [100, 100]); // bottom-right
    assert.deepEqual(project(0.5, 0.5), [50, 50]); // centre
  });

  test('polygonToSvgPath emits a closed M/L/Z path', () => {
    const project = makeProjection(
      { minLng: 0, minLat: 0, maxLng: 1, maxLat: 1 },
      100,
      100,
      0,
    );
    const path = polygonToSvgPath(
      {
        type: 'Polygon',
        coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
      },
      project,
    );
    assert.ok(path.startsWith('M'), 'path must start with M');
    assert.ok(path.endsWith('Z'), 'path must end with Z');
    assert.ok(path.split('L').length >= 4, 'expected several L commands');
  });

  test('expandBbox grows symmetrically by the given fraction', () => {
    const b = { minLng: 0, minLat: 0, maxLng: 10, maxLat: 10 };
    const e = expandBbox(b, 0.1);
    assert.equal(e.minLng, -1);
    assert.equal(e.maxLng, 11);
    assert.equal(e.minLat, -1);
    assert.equal(e.maxLat, 11);
  });

  test('pointInBbox respects the slack fraction', () => {
    const b = { minLng: 0, minLat: 0, maxLng: 1, maxLat: 1 };
    const h = { hotelKey: 'X', name: 'X', lat: 1.05, lng: 0.5 };
    assert.equal(pointInBbox(h, b, 0), false);
    assert.equal(pointInBbox(h, b, 0.1), true);
  });
});
