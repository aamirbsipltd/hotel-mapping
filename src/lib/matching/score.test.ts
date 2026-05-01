import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  scoreMatch,
  classify,
  rankCandidates,
  AUTO_ACCEPT_THRESHOLD,
} from './score';

// ── Exact-match cases ─────────────────────────────────────────────────────────

describe('exact match — name + coords + address', () => {
  test('scores above 0.95 and auto-accepts', () => {
    const result = scoreMatch(
      { id: 's1', name: 'Grand Palace Lisbon', latitude: 38.71, longitude: -9.14, address: 'Rua das Flores 123' },
      { locationId: 't1', name: 'Grand Palace Lisbon', latitude: 38.71, longitude: -9.14, address: 'Rua das Flores 123' },
    );
    assert.ok(result.totalScore > 0.95, `Expected >0.95, got ${result.totalScore}`);
    assert.equal(classify(result.totalScore), 'auto_accept');
  });
});

// ── Token reordering ──────────────────────────────────────────────────────────

describe('token reordering', () => {
  test('"Grand Hotel Lisbon" vs "Lisbon Grand Hotel" = high name score', () => {
    const result = scoreMatch(
      { id: 's1', name: 'Grand Hotel Lisbon', latitude: 38.71, longitude: -9.14 },
      { locationId: 't1', name: 'Lisbon Grand Hotel', latitude: 38.71, longitude: -9.14 },
    );
    assert.ok(result.nameScore > 0.7, `Token reordering should score >0.7, got ${result.nameScore}`);
    assert.equal(classify(result.totalScore), 'auto_accept');
  });

  test('"Hotel ABC" vs "ABC Hotel" resolves correctly', () => {
    const result = scoreMatch(
      { id: 's1', name: 'Hotel ABC', latitude: 48.86, longitude: 2.35 },
      { locationId: 't1', name: 'ABC Hotel', latitude: 48.86, longitude: 2.35 },
    );
    assert.ok(result.nameScore > 0.5, `Suffix-prefix swap should score >0.5, got ${result.nameScore}`);
  });
});

// ── Clearly different hotels ──────────────────────────────────────────────────

describe('clearly different hotels', () => {
  test('different names + 100 km apart = auto_reject', () => {
    const result = scoreMatch(
      { id: 's1', name: 'Hilton Madrid', latitude: 40.42, longitude: -3.71 },
      { locationId: 't1', name: 'Marriott Barcelona', latitude: 41.39, longitude: 2.17 },
    );
    assert.equal(classify(result.totalScore), 'auto_reject');
  });
});

// ── Chain trap — same name, far apart ────────────────────────────────────────

describe('chain trap', () => {
  test('"Hilton Garden Inn" 500+ km apart should not be auto_accept', () => {
    const result = scoreMatch(
      { id: 's1', name: 'Hilton Garden Inn', latitude: 40.42, longitude: -3.71 },
      { locationId: 't1', name: 'Hilton Garden Inn', latitude: 41.39, longitude: 2.17 },
    );
    assert.notEqual(classify(result.totalScore), 'auto_accept');
  });
});

// ── Graceful degradation — missing data ──────────────────────────────────────

describe('graceful degradation', () => {
  test('only name available — identical names score 1.0', () => {
    const result = scoreMatch(
      { id: 's1', name: 'Hotel Avenida Lisboa' },
      { locationId: 't1', name: 'Hotel Avenida Lisboa' },
    );
    assert.equal(result.nameScore, 1);
    assert.equal(result.distanceScore, 0);
    assert.equal(result.totalScore, 1);
  });

  test('coords present, address absent — distance carries remaining weight', () => {
    const result = scoreMatch(
      { id: 's1', name: 'Park Hyatt Tokyo', latitude: 35.69, longitude: 139.70 },
      { locationId: 't1', name: 'Park Hyatt Tokyo', latitude: 35.69, longitude: 139.70 },
    );
    assert.equal(classify(result.totalScore), 'auto_accept');
    assert.ok(result.distanceKm !== null && result.distanceKm < 0.01);
  });
});

// ── Diacritics and character normalisation ────────────────────────────────────

describe('diacritics', () => {
  test('"Hôtel Étoile" vs "Hotel Etoile" scores high', () => {
    const result = scoreMatch(
      { id: 's1', name: 'Hôtel Étoile' },
      { locationId: 't1', name: 'Hotel Etoile' },
    );
    assert.ok(result.nameScore > 0.7, `Diacritics should normalise, got ${result.nameScore}`);
  });
});

// ── Very short hotel names ────────────────────────────────────────────────────

describe('very short names', () => {
  test('"Ace" vs "Ace Hotel" — suffix stripped, core token matches', () => {
    const result = scoreMatch(
      { id: 's1', name: 'Ace' },
      { locationId: 't1', name: 'Ace Hotel' },
    );
    assert.ok(result.nameScore > 0.5, `Short name match should score >0.5, got ${result.nameScore}`);
  });
});

// ── Coordinates at meridian (lng = 0) ─────────────────────────────────────────

describe('coordinates at meridian', () => {
  test('same point at lng=0 scores distance 1.0', () => {
    const result = scoreMatch(
      { id: 's1', name: 'Some Hotel', latitude: 51.5, longitude: 0.0 },
      { locationId: 't1', name: 'Some Hotel', latitude: 51.5, longitude: 0.0 },
    );
    assert.equal(result.distanceScore, 1.0);
  });
});

// ── Phone matching ────────────────────────────────────────────────────────────

describe('phone normalisation', () => {
  test('matching last 7 digits with different formatting', () => {
    const result = scoreMatch(
      { id: 's1', name: 'Test Hotel', phone: '+44 20 7946 0958' },
      { locationId: 't1', name: 'Test Hotel', phone: '02079460958' },
    );
    assert.equal(result.phoneMatch, true);
  });

  test('short phone numbers (<7 digits) do not match', () => {
    const result = scoreMatch(
      { id: 's1', name: 'Test Hotel', phone: '123456' },
      { locationId: 't1', name: 'Test Hotel', phone: '123456' },
    );
    assert.equal(result.phoneMatch, false);
  });
});

// ── Address number bonus ──────────────────────────────────────────────────────

describe('address number bonus', () => {
  test('matching street number bumps address score', () => {
    const result = scoreMatch(
      { id: 's1', name: 'Hotel X', address: '10 Baker Street London' },
      { locationId: 't1', name: 'Hotel X', address: '10 Baker St London' },
    );
    assert.ok(result.addressScore > 0.5);
  });
});

// ── rankCandidates ────────────────────────────────────────────────────────────

describe('rankCandidates', () => {
  test('returns candidates sorted by descending score', () => {
    const source = { id: 's1', name: 'Grand Palace Lisbon', latitude: 38.71, longitude: -9.14 };
    const candidates = [
      { locationId: 't1', name: 'Some Other Hotel', latitude: 38.5, longitude: -9.0 },
      { locationId: 't2', name: 'Grand Palace Lisbon', latitude: 38.71, longitude: -9.14 },
      { locationId: 't3', name: 'Grand Hotel Lisbon', latitude: 38.72, longitude: -9.13 },
    ];
    const ranked = rankCandidates(source, candidates);
    assert.equal(ranked[0].candidate.locationId, 't2');
    assert.ok(ranked[0].breakdown.totalScore > ranked[1].breakdown.totalScore);
  });

  test('empty candidates returns empty array', () => {
    const ranked = rankCandidates({ id: 's1', name: 'Hotel A' }, []);
    assert.deepEqual(ranked, []);
  });

  test('three candidates ordered correctly', () => {
    const source = { id: 's1', name: 'Marriott City Centre', latitude: 53.48, longitude: -2.24 };
    const candidates = [
      { locationId: 't1', name: 'Holiday Inn', latitude: 53.0, longitude: -2.0 },
      { locationId: 't2', name: 'Marriott City Centre Manchester', latitude: 53.48, longitude: -2.24 },
      { locationId: 't3', name: 'Marriott Manchester', latitude: 53.48, longitude: -2.24 },
    ];
    const ranked = rankCandidates(source, candidates);
    assert.equal(ranked.length, 3);
    assert.equal(ranked[0].candidate.locationId, 't2');
    assert.ok(ranked[0].breakdown.totalScore >= ranked[1].breakdown.totalScore);
    assert.ok(ranked[1].breakdown.totalScore >= ranked[2].breakdown.totalScore);
  });

  test('classify is set correctly on ranked matches', () => {
    const source = { id: 's1', name: 'InterContinental Paris Le Grand', latitude: 48.87, longitude: 2.33 };
    const candidates = [
      { locationId: 't1', name: 'InterContinental Paris Le Grand', latitude: 48.87, longitude: 2.33 },
      { locationId: 't2', name: 'Random Budget Hostel', latitude: 43.0, longitude: 1.0 },
    ];
    const ranked = rankCandidates(source, candidates);
    assert.equal(ranked[0].classification, 'auto_accept');
    assert.equal(ranked[ranked.length - 1].classification, 'auto_reject');
  });
});

// ── AUTO_ACCEPT_THRESHOLD constant ────────────────────────────────────────────

describe('threshold constants', () => {
  test('AUTO_ACCEPT_THRESHOLD is 0.85', () => {
    assert.equal(AUTO_ACCEPT_THRESHOLD, 0.85);
  });

  test('classify boundaries', () => {
    assert.equal(classify(0.90), 'auto_accept');
    assert.equal(classify(0.85), 'auto_accept');
    assert.equal(classify(0.84), 'manual_review');
    assert.equal(classify(0.55), 'manual_review');
    assert.equal(classify(0.54), 'auto_reject');
    assert.equal(classify(0.0), 'auto_reject');
  });
});
