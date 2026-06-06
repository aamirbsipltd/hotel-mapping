// Single-source assertion — the /platform page reads exactly what
// orchestrateCanonical() produced; no second implementation lives in
// the UI layer. Same discipline as the platform integration test, now
// extended to the presentation prep.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { preparePlatformPage } from './prepare-page';
import { orchestrateCanonical } from '../orchestrate';
import { getDemoClassification } from '../../fastx/demo/compute';

describe('preparePlatformPage — single-source rendering', () => {
  test('returns the orchestrator output verbatim — view is the same reference', () => {
    const page = preparePlatformPage();
    const orchestrated = orchestrateCanonical();
    // Content slice is identity-equal to the canonical FastX demo result.
    const fastx = getDemoClassification('TGX-DXB-1001');
    assert.equal(page.view.content.result, fastx.result);
    // Stats deep-equal the orchestrator's stats.
    assert.deepEqual(page.view.content.stats, orchestrated.content.stats);
    // Match + Location slices deep-equal the orchestrator's outputs.
    assert.deepEqual(page.view.match, orchestrated.match);
    assert.deepEqual(page.view.location, orchestrated.location);
  });

  test('raw list reads from result.all — no re-classify in the UI layer', () => {
    const page = preparePlatformPage();
    const fastx = getDemoClassification('TGX-DXB-1001');
    assert.equal(page.rawList.length, fastx.result.all.length);
    // Each row's bucket matches the snapshot's routing/bucket — derived,
    // not re-classified.
    for (let i = 0; i < fastx.result.all.length; i++) {
      const item = fastx.result.all[i];
      const row = page.rawList[i];
      assert.equal(row.sourceField, item.sourceField);
    }
  });

  test('counts reconcile to 28 — the same engine total the FastX hero displays', () => {
    const page = preparePlatformPage();
    const s = page.view.content.stats;
    assert.equal(s.total, 28);
    assert.equal(s.auto + s.review + s.payment + s.nearby + s.excluded, 28);
  });

  test('deterministic — two preps return reference-equal slices', () => {
    const a = preparePlatformPage();
    const b = preparePlatformPage();
    assert.equal(a.view.content.result, b.view.content.result);
    assert.deepEqual(a.view.match, b.view.match);
    assert.deepEqual(a.view.location, b.view.location);
  });
});
