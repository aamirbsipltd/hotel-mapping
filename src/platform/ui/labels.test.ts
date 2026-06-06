import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { PLATFORM_LABELS, behaviourHeadline, reconciliationLine, type BiText } from './labels';

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
// human browser pass. Catches anyone adding self-serve affordances to
// the page chrome copy in this file. The page-level scan over rendered
// JSX would need a browser; this asserts the *source of truth* for the
// platform's own strings.
describe('done-for-you copy — no self-serve affordances in the platform label set', () => {
  test('headline and subcopy contain no signup / login / upload / "get started" affordances', () => {
    const banned = [
      /sign\s*up/i,
      /\blog\s*in\b/i,
      /create\s+account/i,
      /upload\s+your/i,
      /start\s+free/i,
      /get\s+started/i,
      /try\s+it\s+free/i,
    ];
    const surfaces = [
      PLATFORM_LABELS.headline.en,
      PLATFORM_LABELS.headline.de,
      PLATFORM_LABELS.subcopy.en,
      PLATFORM_LABELS.subcopy.de,
      PLATFORM_LABELS.poweredBy.en,
      PLATFORM_LABELS.poweredBy.de,
    ];
    for (const s of surfaces) {
      for (const re of banned) {
        assert.ok(!re.test(s), `self-serve phrase ${re} appears in: "${s}"`);
      }
    }
  });
});
