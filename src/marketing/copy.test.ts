// Site-wide marketing copy guard.
//
// Walks every string in src/marketing/copy.ts and asserts:
//   1. No self-serve affordances anywhere (signup / login / "get started"
//      / "try free" / "buy" / "choose a plan" / "subscribe").
//   2. The CTAs use the allowed done-for-you vocabulary ("see the live
//      demo," "book a call," "get in touch," "request a quote").
//
// Same discipline `src/platform/ui/labels.test.ts` enforces over the
// /platform copy — extended here site-wide. If a future page is added,
// its strings belong in copy.ts and they get scanned automatically.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  CAPABILITIES_STUB,
  CONTACT_STUB,
  FOOTER_COPY,
  HOME_COPY,
  HOW_IT_WORKS_STUB,
  PRIMARY_CTA,
  SITE_BRAND,
  SITE_NAV,
} from './copy';

// Self-serve / checkout / signup affordances — banned everywhere.
const BANNED_SELFSERVE = [
  /sign\s*up/i,
  /\blog\s*in\b/i,
  /\blogin\b/i,
  /create\s+account/i,
  /upload\s+your/i,
  /start\s+free/i,
  /get\s+started/i,
  /try\s+(it\s+)?free/i,
  /\bbuy\s+(now|it|a\b)/i,
  /choose\s+a\s+plan/i,
  /pick\s+a\s+plan/i,
  /select\s+a\s+plan/i,
  /\bsubscribe\b/i,
];

// Honesty rules — phrases that imply a live integration / fabricated
// social proof. Catch the obvious "trusted by N", "join N companies",
// "rated 4.9" patterns so a copy edit can't sneak them in.
const BANNED_FABRICATION = [
  /trusted\s+by\s+\d/i,
  /join\s+\d+(?:,\d+)*\s+(companies|teams|hotels|customers|users)/i,
  /(?:rated|score)\s+\d(?:\.\d)?\s*\/?\s*5\b/i,
  /\d+\+\s+(?:happy\s+)?customers/i,
  /testimonials?\s+from/i,
];

function* walkStrings(node: unknown, path: string[] = []): Generator<{ path: string; text: string }> {
  if (typeof node === 'string') {
    yield { path: path.join('.'), text: node };
    return;
  }
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      yield* walkStrings(node[i], [...path, String(i)]);
    }
    return;
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      yield* walkStrings(v, [...path, k]);
    }
  }
}

function allMarketingStrings() {
  return [
    ...walkStrings({ SITE_BRAND }, ['SITE_BRAND']),
    ...walkStrings({ SITE_NAV }, ['SITE_NAV']),
    ...walkStrings({ PRIMARY_CTA }, ['PRIMARY_CTA']),
    ...walkStrings({ HOME_COPY }, ['HOME_COPY']),
    ...walkStrings({ FOOTER_COPY }, ['FOOTER_COPY']),
    ...walkStrings({ HOW_IT_WORKS_STUB }, ['HOW_IT_WORKS_STUB']),
    ...walkStrings({ CAPABILITIES_STUB }, ['CAPABILITIES_STUB']),
    ...walkStrings({ CONTACT_STUB }, ['CONTACT_STUB']),
  ];
}

describe('marketing copy — no self-serve affordances site-wide', () => {
  test('no banned self-serve phrase appears in any marketing string', () => {
    for (const { path, text } of allMarketingStrings()) {
      for (const re of BANNED_SELFSERVE) {
        assert.ok(
          !re.test(text),
          `${path} matches banned self-serve phrase ${re}: "${text}"`,
        );
      }
    }
  });

  test('hrefs do not point at /signup /login /checkout /buy paths', () => {
    const bannedHrefs = ['/signup', '/sign-up', '/login', '/log-in', '/checkout', '/buy', '/billing', '/subscribe'];
    for (const { path, text } of allMarketingStrings()) {
      if (!text.startsWith('/')) continue;
      for (const bad of bannedHrefs) {
        assert.notEqual(text, bad, `${path} points to ${bad}`);
      }
    }
  });
});

describe('marketing copy — honesty guards', () => {
  test('no fabricated social proof / "trusted by N" / invented metric patterns', () => {
    for (const { path, text } of allMarketingStrings()) {
      for (const re of BANNED_FABRICATION) {
        assert.ok(
          !re.test(text),
          `${path} matches fabrication pattern ${re}: "${text}"`,
        );
      }
    }
  });

  test('contact-flow CTAs use done-for-you vocabulary (conversation, not checkout)', () => {
    // PRIMARY_CTA + closing.primaryCta + secondary.label must read as a
    // conversation invitation, not a transaction. Whitelist the phrases
    // we expect; future copy can extend this list as the marketing voice
    // evolves.
    const allowed = [
      /book\s+a\s+call/i,
      /get\s+in\s+touch/i,
      /request\s+a\s+quote/i,
      /see\s+the\s+live\s+demo/i,
      /see\s+the\s+(region|content|platform)\s+(demo|walkthrough)/i,
      /talk\s+to\s+us/i,
      /send\s+us/i,
    ];
    const callToActions = [
      PRIMARY_CTA.label,
      HOME_COPY.hero.primaryCta.label,
      HOME_COPY.hero.secondaryCta.label,
      HOME_COPY.closing.primaryCta.label,
      HOME_COPY.closing.secondaryCta.label,
    ];
    for (const cta of callToActions) {
      const ok = allowed.some((re) => re.test(cta));
      assert.ok(ok, `CTA "${cta}" is not in the done-for-you vocabulary whitelist`);
    }
  });
});

describe('marketing copy — content shape', () => {
  test('three capabilities, region mapping first (the differentiator)', () => {
    assert.equal(HOME_COPY.capabilities.length, 3);
    assert.equal(HOME_COPY.capabilities[0].id, 'region');
  });

  test('every capability links to a working demo route', () => {
    const liveDemos = new Set(['/regions', '/fastx', '/platform']);
    for (const c of HOME_COPY.capabilities) {
      assert.ok(liveDemos.has(c.demo.href), `${c.id} demo href "${c.demo.href}" is not a known live demo route`);
    }
  });

  test('hero links to /platform — the live engine, not a screenshot', () => {
    assert.equal(HOME_COPY.hero.primaryCta.href, '/platform');
  });

  test('nav has six items and Home is first', () => {
    assert.equal(SITE_NAV.length, 6);
    assert.equal(SITE_NAV[0].href, '/');
    assert.equal(SITE_NAV[0].label, 'Home');
  });
});
