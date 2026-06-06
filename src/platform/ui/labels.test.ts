import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  PLATFORM_LABELS,
  behaviourHeadline,
  reconciliationLine,
  matchBeat,
  locationBeat,
  contentBeat,
  scorecardFromView,
  type BiText,
} from './labels';
import { orchestrateCanonical } from '../orchestrate';

function isBiText(x: unknown): x is BiText {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return typeof o.en === 'string' && typeof o.de === 'string';
}

function* walkBiTexts(node: unknown, path: string[] = []): Generator<{ path: string; text: BiText }> {
  if (isBiText(node)) {
    yield { path: path.join('.'), text: node };
    return;
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      yield* walkBiTexts(v, [...path, k]);
    }
  }
}

describe('PLATFORM_LABELS — bilingual completeness', () => {
  test('every BiText leaf has non-empty en and de', () => {
    let count = 0;
    for (const { path, text } of walkBiTexts(PLATFORM_LABELS)) {
      assert.ok(text.en && text.en.trim().length > 0, `${path}: empty en`);
      assert.ok(text.de && text.de.trim().length > 0, `${path}: empty de`);
      count++;
    }
    assert.ok(count >= 30, `expected ≥30 bilingual entries, found ${count}`);
  });

  test('reconciliation banner renders in both locales with counts woven through', () => {
    const counts = { total: 28, auto: 20, review: 1, payment: 4, nearby: 1, excluded: 2 };
    const en = behaviourHeadline(counts, 'en');
    const de = behaviourHeadline(counts, 'de');
    assert.match(en, /20 auto-classified/);
    assert.match(en, /1 flagged for review/);
    assert.match(en, /4 → Payment/);
    assert.match(en, /1 → Nearby/);
    assert.match(en, /2 dropped/);
    assert.match(en, /zero misclassified/);
    assert.match(de, /20 automatisch klassifiziert/);
    assert.match(de, /1 zur Prüfung markiert/);
    assert.match(de, /4 → Zahlung/);
    assert.match(de, /1 → In der Umgebung/);
    assert.match(de, /2 verworfen/);
    assert.match(de, /null Fehlklassifikationen/);
  });

  test('reconciliation line renders both locales with the total', () => {
    assert.match(reconciliationLine(28, 'en'), /28 raw attributes in → 28 accounted for/);
    assert.match(reconciliationLine(28, 'de'), /28 Roh-Attribute hinein → 28 vollständig zugeordnet/);
  });
});

// ── Done-for-you copy guard — automated check, complementary to the
// human browser pass. Scans the entire bilingual label set plus every
// dynamic beat so a future addition cannot smuggle in self-serve copy
// that the test misses by being scoped only to the header.
const BANNED_SELFSERVE = [
  /sign\s*up/i,
  /\blog\s*in\b/i,
  /create\s+account/i,
  /upload\s+your/i,
  /start\s+free/i,
  /get\s+started/i,
  /try\s+it\s+free/i,
];

describe('done-for-you copy — no self-serve affordances anywhere on /platform', () => {
  test('every BiText leaf in PLATFORM_LABELS is self-serve-free in both locales', () => {
    for (const { path, text } of walkBiTexts(PLATFORM_LABELS)) {
      for (const re of BANNED_SELFSERVE) {
        assert.ok(!re.test(text.en), `${path}.en matches ${re}: "${text.en}"`);
        assert.ok(!re.test(text.de), `${path}.de matches ${re}: "${text.de}"`);
      }
    }
  });

  test('every dynamic beat (Match / Location / Content) is self-serve-free in both locales', () => {
    const view = orchestrateCanonical();
    const beats = [
      matchBeat(view, 'en'),
      matchBeat(view, 'de'),
      locationBeat(view, 'en'),
      locationBeat(view, 'de'),
      contentBeat(view, 'en'),
      contentBeat(view, 'de'),
    ];
    for (const text of beats) {
      assert.ok(text && text.trim().length > 0, `beat is empty: "${text}"`);
      for (const re of BANNED_SELFSERVE) {
        assert.ok(!re.test(text), `beat matches ${re}: "${text}"`);
      }
    }
  });
});

describe('dynamic beats — engine-derived, bilingual, woven through the view', () => {
  test('matchBeat weaves rating and review count from the orchestrated view, in both locales', () => {
    const view = orchestrateCanonical();
    const en = matchBeat(view, 'en');
    const de = matchBeat(view, 'de');
    // Engine derived — rating + review count appear, in both locales,
    // localised number formatting.
    assert.match(en, /4\.6★/);
    assert.match(en, /2,843 reviews/);
    assert.match(de, /4,6★/);
    assert.match(de, /2\.843 Rezensionen/);
  });

  test('locationBeat weaves destination + region from the view', () => {
    const view = orchestrateCanonical();
    const en = locationBeat(view, 'en');
    assert.ok(en.includes('Dubai'));
    assert.ok(en.includes('Dubai Marina'));
  });

  test('contentBeat weaves the engine total (28) from the view', () => {
    const view = orchestrateCanonical();
    assert.match(contentBeat(view, 'en'), /28 mixed attributes/);
    assert.match(contentBeat(view, 'de'), /28 vermischte Attribute/);
  });

  test('scorecard data is engine-derived: matched=true, region=Dubai Marina, misclassified=0', () => {
    const view = orchestrateCanonical();
    const s = scorecardFromView(view);
    assert.equal(s.matched, true);
    assert.equal(s.regionName, 'Dubai Marina');
    assert.equal(s.misclassified, 0);
  });
});
