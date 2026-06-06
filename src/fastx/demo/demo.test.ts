import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  clearDemoCache,
  getAllDemoClassifications,
  getDemoClassification,
  HEADLINE_HOTEL_CODE,
} from './compute';
import { amenityLabel, categoryLabel } from './labels';
import { classifyHotel } from '../classify';
import { FIXTURES } from '../fixtures';
import { CATEGORIES, ORDERED_CATEGORY_IDS, type Locale } from '../taxonomy';

describe('demo classification — single canonical result source', () => {
  test('is deterministic and cached per hotel code', () => {
    clearDemoCache();
    const a = getDemoClassification(HEADLINE_HOTEL_CODE);
    const b = getDemoClassification(HEADLINE_HOTEL_CODE);
    assert.equal(a, b, 'expected cached identity');
  });

  test('Dubai demo equals the canonical pipeline output exactly — {28, 20, 1, 4, 1, 2}', () => {
    clearDemoCache();
    const demo = getDemoClassification(HEADLINE_HOTEL_CODE);
    const pipeline = classifyHotel(demo.hotel);
    assert.deepEqual(demo.result.stats, pipeline.stats);
    assert.deepEqual(demo.result.stats, {
      total: 28,
      auto: 20,
      review: 1,
      payment: 4,
      nearby: 1,
      excluded: 2,
      autoRate: 20 / 21,
      autoRateDenominator: 21,
    });
  });

  test('every fixture round-trips through the pipeline without a second classifier', () => {
    clearDemoCache();
    for (const fixture of FIXTURES) {
      const demo = getDemoClassification(fixture.hotelCode);
      const pipeline = classifyHotel(fixture);
      assert.deepEqual(demo.result.stats, pipeline.stats);
      assert.equal(demo.result.all.length, pipeline.all.length);
    }
  });

  test('headline counts reconcile to the fixture total — total === auto + review + payment + nearby + excluded', () => {
    clearDemoCache();
    for (const demo of getAllDemoClassifications()) {
      const s = demo.result.stats;
      assert.equal(s.auto + s.review + s.payment + s.nearby + s.excluded, s.total);
    }
  });
});

// ── Bilingual completeness — the "stop and report" gate ────────────────────

describe('bilingual completeness — every displayed label resolves to both EN and DE', () => {
  const LOCALES: Locale[] = ['en', 'de'];

  test('every taxonomy category has EN + DE labels', () => {
    for (const id of ORDERED_CATEGORY_IDS) {
      for (const loc of LOCALES) {
        const label = categoryLabel(id, loc);
        assert.ok(
          label && label.trim().length > 0,
          `category ${id} missing ${loc} label`,
        );
      }
    }
    // Belt-and-braces — the CATEGORIES record itself is well-formed.
    for (const id of ORDERED_CATEGORY_IDS) {
      assert.ok(CATEGORIES[id].labels.en, `CATEGORIES[${id}].labels.en missing`);
      assert.ok(CATEGORIES[id].labels.de, `CATEGORIES[${id}].labels.de missing`);
    }
  });

  test('every displayed amenity, payment, and nearby item resolves to both EN and DE', () => {
    clearDemoCache();
    for (const demo of getAllDemoClassifications()) {
      const displayed = [
        ...Object.values(demo.result.categories).flat(),
        ...demo.result.payment,
        ...demo.result.nearby,
      ];
      for (const item of displayed) {
        for (const loc of LOCALES) {
          const label = amenityLabel(item, loc);
          assert.ok(
            label && label.trim().length > 0,
            `${demo.hotel.hotelCode}: item "${item.rawText}" → empty ${loc} label`,
          );
        }
      }
    }
  });
});
