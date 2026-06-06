// Integration test for the FastX write-back learning loop.
//
// Touches real Prisma + the local SQLite dev DB. Resets only the FastX
// tables; never `.deleteMany({})` against tables this module does not
// own. Mirrors src/regions/service/service.test.ts's discipline.
//
// The load-bearing claim: approving the shisha-lounge review item
// promotes it from review to auto on the very next classify run, with
// the auto count rising by exactly 1 and the invariant still
// reconciling. Idempotency: resolving the same item twice is a no-op
// on both ReviewItem (already RESOLVED) and AmenityMapping (single row).

import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../lib/prisma';
import { classifyByHotelCode } from './classify-run';
import { resolveReviewItem } from './resolve-review';
import { bestKeyFor } from './best-key';

async function resetFastXTables() {
  // Order respects FK cascade: reviewItems are children of classificationRuns.
  // amenityMappings are independent of runs/reviews.
  await prisma.reviewItem.deleteMany({});
  await prisma.classificationRun.deleteMany({});
  await prisma.amenityMapping.deleteMany({});
}

describe('FastX service — write-back learning loop', () => {
  before(async () => {
    await resetFastXTables();
  });

  beforeEach(async () => {
    await resetFastXTables();
  });

  after(async () => {
    // Do not call prisma.$disconnect() — the Prisma client is a singleton
    // shared with other service tests in this run. Disconnecting here
    // would close the connection out from under the next suite.
    await resetFastXTables();
  });

  test('first classify run produces exactly one review item — shisha — with a stable key for the next run to hit', async () => {
    const { result, runId } = await classifyByHotelCode('TGX-DXB-1001');
    assert.equal(result.stats.review, 1);

    const reviews = await prisma.reviewItem.findMany({ where: { runId } });
    assert.equal(reviews.length, 1);
    const shisha = reviews[0];
    assert.ok(shisha.rawText.toLowerCase().includes('shisha'));
    // The brief's tripwire: the key persisted on the review item is
    // the same shape Stage 1 (exact.ts) will look up. Shisha has a
    // supplier code (SHISHA_LOUNGE) so SUPPLIER is the chosen type.
    assert.equal(shisha.mappingKeyType, 'SUPPLIER');
    assert.equal(shisha.mappingKey, 'SHISHA_LOUNGE');
  });

  test('approve shisha → re-run → shisha is auto, auto rises by exactly 1, review drops to 0', async () => {
    const first = await classifyByHotelCode('TGX-DXB-1001');
    const firstReviews = await prisma.reviewItem.findMany({ where: { runId: first.runId } });
    const shisha = firstReviews[0];

    // Operator approves shisha into food_drink.
    await resolveReviewItem(shisha.id, 'food_drink');

    // The mapping row landed under exactly the storage key Stage 1
    // looks up — SUPPLIER:SHISHA_LOUNGE — not under raw text.
    const mapping = await prisma.amenityMapping.findUnique({
      where: { key: 'SUPPLIER:SHISHA_LOUNGE' },
    });
    assert.ok(mapping, 'amenity mapping was not written under the Stage 1 lookup key');
    assert.equal(mapping.categoryId, 'food_drink');
    assert.equal(mapping.source, 'REVIEW');

    // Re-run the same hotel — the learning step must take effect.
    const second = await classifyByHotelCode('TGX-DXB-1001');
    assert.equal(
      second.result.stats.review,
      0,
      `expected 0 review items after approving shisha, got ${second.result.stats.review}`,
    );
    assert.equal(
      second.result.stats.auto,
      first.result.stats.auto + 1,
      `expected auto count to rise by 1 (was ${first.result.stats.auto}, now ${second.result.stats.auto})`,
    );

    // Invariant still holds with the new tally.
    const s = second.result.stats;
    assert.equal(s.auto + s.review + s.payment + s.nearby + s.excluded, s.total);

    // Shisha is now in the food_drink category in the result, via Stage 1.
    const inFoodDrink = second.result.categories.food_drink.find((i) =>
      i.rawText.toLowerCase().includes('shisha'),
    );
    assert.ok(inFoodDrink, 'shisha did not land in food_drink');
    assert.equal(inFoodDrink?.method, 'exact');
  });

  test('idempotency: re-resolving the same review item does not duplicate the AmenityMapping row', async () => {
    const first = await classifyByHotelCode('TGX-DXB-1001');
    const shisha = (await prisma.reviewItem.findMany({ where: { runId: first.runId } }))[0];

    await resolveReviewItem(shisha.id, 'food_drink');
    const firstCount = await prisma.amenityMapping.count();

    // The ReviewItem is now RESOLVED; resolving it a second time runs
    // through the upsert path and must not create another row.
    await resolveReviewItem(shisha.id, 'food_drink');
    const secondCount = await prisma.amenityMapping.count();
    assert.equal(
      firstCount,
      secondCount,
      `AmenityMapping rows changed across idempotent resolves: ${firstCount} → ${secondCount}`,
    );
  });

  test('the learning is portable: a brand-new fixture sharing the SHISHA_LOUNGE supplier code would also auto-hit', async () => {
    // The "supports future suppliers" claim made real, asserted at the
    // mapping-dictionary level (no second fixture needed): after the
    // resolve, loading the mapping dictionary returns food_drink for
    // SUPPLIER:SHISHA_LOUNGE — any HotelData carrying that supplier
    // code will now hit Stage 1 regardless of its hotelCode.
    const first = await classifyByHotelCode('TGX-DXB-1001');
    const shisha = (await prisma.reviewItem.findMany({ where: { runId: first.runId } }))[0];
    await resolveReviewItem(shisha.id, 'food_drink');

    const { loadMappingDictionary } = await import('./store');
    const dict = await loadMappingDictionary();
    assert.equal(dict.get('SUPPLIER:SHISHA_LOUNGE'), 'food_drink');
  });
});

describe('bestKeyFor — picks the same shape Stage 1 looks up', () => {
  test('TGX canonical code wins when present', () => {
    const k = bestKeyFor({
      canonicalCode: 'WIFI_FREE',
      supplierCode: 'WIFI',
      rawText: 'Free Wi-Fi',
    });
    assert.equal(k?.keyType, 'TGX');
    assert.equal(k?.storageKey, 'TGX:WIFI_FREE');
  });

  test('GIATA wins over supplier code when no TGX', () => {
    const k = bestKeyFor({
      giataCode: '4001',
      supplierCode: 'WIFI',
      rawText: 'Wi-Fi',
    });
    assert.equal(k?.keyType, 'GIATA');
    assert.equal(k?.storageKey, 'GIATA:4001');
  });

  test('supplier code wins over raw text when no codes', () => {
    const k = bestKeyFor({ supplierCode: 'SHISHA_LOUNGE', rawText: 'Shisha lounge' });
    assert.equal(k?.keyType, 'SUPPLIER');
    assert.equal(k?.storageKey, 'SUPPLIER:SHISHA_LOUNGE');
  });

  test('normalised text is the last resort', () => {
    const k = bestKeyFor({ rawText: 'Shisha Lounge' });
    assert.equal(k?.keyType, 'TEXT');
    assert.ok(k?.storageKey.startsWith('TEXT:'));
  });

  test('returns null when there is no usable key at all', () => {
    const k = bestKeyFor({ rawText: '' });
    assert.equal(k, null);
  });
});
