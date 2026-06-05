import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SEED_REGIONS } from './regions';
import { SEED_DESTINATIONS } from './destinations';
import { SEED_COUNTRIES } from './countries';
import { computeBbox, computeCentroid, bboxContainsPolygon } from '../geo/coords';
import { FIXTURE_HOTELS } from '../fixtures/hotels';

describe('seed regions — structural validity', () => {
  test('every region has a finite centroid', () => {
    for (const r of SEED_REGIONS) {
      const c = computeCentroid(r.polygon);
      assert.ok(Number.isFinite(c.lat), `${r.slug}: centroid.lat not finite`);
      assert.ok(Number.isFinite(c.lng), `${r.slug}: centroid.lng not finite`);
      assert.ok(c.lat > -90 && c.lat < 90, `${r.slug}: centroid.lat out of range: ${c.lat}`);
      assert.ok(c.lng > -180 && c.lng < 180, `${r.slug}: centroid.lng out of range: ${c.lng}`);
    }
  });

  test('every region has a valid bbox enclosing the polygon', () => {
    for (const r of SEED_REGIONS) {
      const bbox = computeBbox(r.polygon);
      const [minLng, minLat, maxLng, maxLat] = bbox;
      assert.ok(minLng < maxLng, `${r.slug}: bbox lng degenerate`);
      assert.ok(minLat < maxLat, `${r.slug}: bbox lat degenerate`);
      assert.ok(
        bboxContainsPolygon(bbox, r.polygon),
        `${r.slug}: computed bbox does not enclose polygon`,
      );
    }
  });

  test('region slugs are unique', () => {
    const slugs = SEED_REGIONS.map((r) => r.slug);
    assert.equal(new Set(slugs).size, slugs.length, 'duplicate region slug');
  });

  test('every region references an existing destination', () => {
    const destSlugs = new Set(SEED_DESTINATIONS.map((d) => d.slug));
    for (const r of SEED_REGIONS) {
      assert.ok(
        destSlugs.has(r.destinationSlug),
        `${r.slug}: destinationSlug "${r.destinationSlug}" not in SEED_DESTINATIONS`,
      );
    }
  });

  test('every destination references an existing country', () => {
    const codes = new Set(SEED_COUNTRIES.map((c) => c.code));
    for (const d of SEED_DESTINATIONS) {
      assert.ok(codes.has(d.countryCode), `${d.slug}: countryCode "${d.countryCode}" not seeded`);
    }
  });
});

describe('fixture hotels — sanity', () => {
  test('hotelKeys are unique', () => {
    const keys = FIXTURE_HOTELS.map((h) => h.hotelKey);
    assert.equal(new Set(keys).size, keys.length, 'duplicate hotelKey');
  });

  test('every hotel has finite coordinates', () => {
    for (const h of FIXTURE_HOTELS) {
      assert.ok(Number.isFinite(h.lat) && h.lat > -90 && h.lat < 90, `${h.hotelKey}: bad lat`);
      assert.ok(Number.isFinite(h.lng) && h.lng > -180 && h.lng < 180, `${h.hotelKey}: bad lng`);
    }
  });

  test('expected edge cases are present', () => {
    assert.ok(
      FIXTURE_HOTELS.some((h) => h.hotelKey === 'TGX-DXB-MIX-001'),
      'overlap-zone canary missing',
    );
    assert.ok(
      FIXTURE_HOTELS.some((h) => h.hotelKey === 'TGX-DXB-OFF-001'),
      'offshore canary missing',
    );
  });
});
