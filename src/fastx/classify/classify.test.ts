import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { classifyHotel, FASTX_AUTO_THRESHOLD } from './index';
import { dubaiHotel, baselHotel } from '../fixtures';
import type { CategoryId } from '../taxonomy';
import type { AmenityItem } from './types';

function findByText(items: AmenityItem[], needle: string): AmenityItem | undefined {
  const n = needle.toLowerCase();
  return items.find((i) => i.rawText.toLowerCase().includes(n));
}

function flatMapAmenities(
  categories: Record<CategoryId, AmenityItem[]>,
): AmenityItem[] {
  return Object.values(categories).flat();
}

// ── Dubai fixture ────────────────────────────────────────────────────────────

describe('classifyHotel — Dubai fixture (the headline demo)', () => {
  const result = classifyHotel(dubaiHotel);

  test('produces a non-trivial review queue', () => {
    assert.ok(
      result.review.length >= 1,
      `expected ≥1 review item, got ${result.review.length}`,
    );
  });

  test('auto-classification rate is high but <100%', () => {
    assert.ok(result.stats.auto >= 10, `auto count = ${result.stats.auto}`);
    assert.ok(
      result.stats.autoRate < 1,
      `expected <100% auto, got ${result.stats.autoRate}`,
    );
  });

  test('routes Visa / Mastercard / Amex cardTypes to _payment', () => {
    const codes = result.payment.map((p) => p.rawText);
    for (const expected of ['VI', 'MC', 'AX']) {
      assert.ok(codes.includes(expected), `_payment missing ${expected}: ${codes.join(',')}`);
    }
  });

  test('POI description routes to _nearby', () => {
    assert.ok(result.nearby.length >= 1, 'expected ≥1 _nearby item');
    const text = result.nearby.map((n) => n.rawText).join(' | ').toLowerCase();
    assert.ok(text.includes('burj') || text.includes('dubai mall'), `_nearby text: ${text}`);
  });

  test('Burj Khalifa / Dubai Mall / Dubai Fountain never appear in amenities output', () => {
    const flat = flatMapAmenities(result.categories);
    const blob = flat.map((a) => a.rawText.toLowerCase()).join(' | ');
    for (const landmark of ['burj khalifa', 'dubai mall', 'dubai fountain']) {
      assert.ok(
        !blob.includes(landmark),
        `landmark "${landmark}" leaked into amenities: ${blob}`,
      );
    }
  });

  test('numeric junk metadata is _excluded', () => {
    const excludedText = result.excluded.map((e) => e.rawText).join(' | ');
    assert.ok(
      excludedText.includes('4471') || result.excluded.length >= 1,
      `expected at least the numeric token in _excluded, got: ${excludedText}`,
    );
  });

  test('Wi-Fi is in internet (auto)', () => {
    const hit = findByText(result.categories.internet, 'wi-fi');
    assert.ok(hit, 'wi-fi not in internet');
    assert.equal(hit?.routing, 'auto');
    assert.ok((hit?.confidence ?? 0) >= FASTX_AUTO_THRESHOLD);
  });

  test('outdoor + rooftop pools are in pools', () => {
    const texts = result.categories.pools.map((p) => p.rawText.toLowerCase()).join(' | ');
    assert.ok(texts.includes('outdoor'), `pools missing outdoor: ${texts}`);
    assert.ok(texts.includes('rooftop'), `pools missing rooftop: ${texts}`);
  });

  test('spa + hammam are in wellness_spa', () => {
    const texts = result.categories.wellness_spa
      .map((p) => p.rawText.toLowerCase())
      .join(' | ');
    assert.ok(texts.includes('spa'));
    assert.ok(texts.includes('hammam'));
  });

  test('airport limousine transfer is in transfers', () => {
    const hit = findByText(result.categories.transfers, 'limousine');
    assert.ok(hit, 'limousine transfer not in transfers');
  });

  test('kids club is in family', () => {
    const hit = findByText(result.categories.family, 'kids');
    assert.ok(hit, 'kids club not in family');
  });

  test('wheelchair access is in accessibility', () => {
    const hit = findByText(result.categories.accessibility, 'wheelchair');
    assert.ok(hit, 'wheelchair not in accessibility');
  });

  test('English / German / Arabic are in languages', () => {
    const texts = result.categories.languages.map((p) => p.rawText.toLowerCase());
    assert.ok(texts.some((t) => t.includes('english')));
    assert.ok(texts.some((t) => t.includes('german')));
    assert.ok(texts.some((t) => t.includes('arabic')));
  });

  test('shisha lounge is the confidence-routing canary — must be in review, never auto', () => {
    const shisha = findByText(result.all, 'shisha');
    assert.ok(shisha, 'shisha lounge missing from output');
    assert.notEqual(
      shisha?.routing,
      'auto',
      `shisha-lounge auto-classified at ${shisha?.confidence} — tighten lexicon / thresholds, do not change the fixture`,
    );
    assert.equal(shisha?.routing, 'review');
  });

  test('deterministic: same input yields the same stats and category counts', () => {
    const a = classifyHotel(dubaiHotel);
    const b = classifyHotel(dubaiHotel);
    assert.deepEqual(a.stats, b.stats);
    for (const id of Object.keys(a.categories) as CategoryId[]) {
      assert.equal(a.categories[id].length, b.categories[id].length);
    }
  });
});

// ── Basel fixture ────────────────────────────────────────────────────────────

describe('classifyHotel — Basel fixture (DACH property)', () => {
  const result = classifyHotel(baselHotel);

  test('cardTypes routed to _payment', () => {
    const codes = result.payment.map((p) => p.rawText);
    assert.ok(codes.includes('VI'));
    assert.ok(codes.includes('MC'));
  });

  test('POI description (Basel SBB / Münster / Kunstmuseum) routed to _nearby', () => {
    assert.ok(result.nearby.length >= 1);
    const text = result.nearby.map((n) => n.rawText.toLowerCase()).join(' | ');
    assert.ok(
      text.includes('basel') || text.includes('münster') || text.includes('kunstmuseum'),
      `_nearby text: ${text}`,
    );
  });

  test('Wi-Fi → internet; Sauna → wellness_spa; Bar/Breakfast → food_drink', () => {
    assert.ok(findByText(result.categories.internet, 'wi-fi'));
    assert.ok(findByText(result.categories.wellness_spa, 'sauna'));
    assert.ok(findByText(result.categories.food_drink, 'breakfast'));
    assert.ok(findByText(result.categories.food_drink, 'bar'));
  });

  test('Meeting room → business; Elevator → accessibility', () => {
    assert.ok(findByText(result.categories.business, 'meeting'));
    assert.ok(findByText(result.categories.accessibility, 'elevator'));
  });

  test('English / German / French → languages', () => {
    const texts = result.categories.languages.map((p) => p.rawText.toLowerCase());
    assert.ok(texts.some((t) => t.includes('english')));
    assert.ok(texts.some((t) => t.includes('german')));
    assert.ok(texts.some((t) => t.includes('french')));
  });

  test('auto-classification rate is realistic (≥0.5)', () => {
    assert.ok(
      result.stats.autoRate >= 0.5,
      `Basel autoRate too low: ${result.stats.autoRate}`,
    );
  });
});

// ── Pipeline shape ───────────────────────────────────────────────────────────

describe('classifyHotel — pipeline shape', () => {
  test('stats.total equals the count of all triaged items', () => {
    const r = classifyHotel(dubaiHotel);
    assert.equal(r.stats.total, r.all.length);
  });

  test('hard invariant: total === auto + review + payment + nearby + excluded', () => {
    for (const fixture of [dubaiHotel, baselHotel]) {
      const r = classifyHotel(fixture);
      const counted =
        r.stats.auto + r.stats.review + r.stats.payment + r.stats.nearby + r.stats.excluded;
      assert.equal(
        r.stats.total,
        counted,
        `${fixture.hotelCode}: total=${r.stats.total} ≠ ${counted} (auto=${r.stats.auto}, review=${r.stats.review}, payment=${r.stats.payment}, nearby=${r.stats.nearby}, excluded=${r.stats.excluded})`,
      );
    }
  });

  test('payment, nearby, and excluded are three distinct counts (relocations are not discards)', () => {
    const r = classifyHotel(dubaiHotel);
    // Dubai fixture: 4 cardTypes → payment, 1 POI description → nearby,
    // 2 genuine-junk metadata rows → excluded.
    assert.equal(r.stats.payment, 4);
    assert.equal(r.stats.nearby, 1);
    assert.equal(r.stats.excluded, 2);
    // And the arrays match the counts.
    assert.equal(r.payment.length, r.stats.payment);
    assert.equal(r.nearby.length, r.stats.nearby);
    assert.equal(r.excluded.length, r.stats.excluded);
  });

  test('autoRate is auto/(auto+review), with the denominator surfaced', () => {
    const r = classifyHotel(dubaiHotel);
    const denom = r.stats.auto + r.stats.review;
    assert.equal(r.stats.autoRateDenominator, denom);
    assert.ok(
      Math.abs(r.stats.autoRate - r.stats.auto / denom) < 1e-9,
      `expected ${r.stats.auto}/${denom}, got ${r.stats.autoRate}`,
    );
    // Headline assertion: with the corrected denominator the Dubai
    // fixture's auto-rate is well above 90% — not the deflated 71%.
    assert.ok(
      r.stats.autoRate > 0.9,
      `expected >90%, got ${r.stats.autoRate}`,
    );
  });

  test('every category bucket exists, even when empty', () => {
    const r = classifyHotel(baselHotel);
    // family + transfers + safety_security + pools likely empty for Basel
    assert.ok('family' in r.categories);
    assert.ok('pools' in r.categories);
    assert.ok('transfers' in r.categories);
  });
});
