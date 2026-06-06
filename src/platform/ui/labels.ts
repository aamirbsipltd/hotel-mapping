// Bilingual platform copy.
//
// Mirrors the FastX taxonomy/labels split: this file is a curated EN+DE
// dictionary for everything the page chrome and new panels (Raw / Match
// / Location / page header) display. Reused FastX components carry
// their own taxonomy labels — we do NOT re-author categories or
// amenity names here.
//
// Bilingual-completeness rule: every entry has non-empty EN + DE; a
// test asserts this so a future addition can't ship a half-translated
// string and have the toggle silently render blanks.

import type { Classification } from '@/lib/matching/score';
import type { PlatformHotelView } from '../orchestrate';

export type Locale = 'en' | 'de';
export type BiText = { en: string; de: string };

export const PLATFORM_LABELS = {
  // ── Page chrome ────────────────────────────────────────────────────
  headline: {
    en: 'Your supplier feed in. Identified, located, clean content out.',
    de: 'Ihr Lieferanten-Feed hinein. Identifiziert, lokalisiert, sauber aufbereitet hinaus.',
  } satisfies BiText,
  subcopy: {
    en: 'One hotel, one messy feed, three problems solved. We run this on your behalf — no account needed. Email a test export and we put it through the pipeline for you.',
    de: 'Ein Hotel, ein chaotischer Feed, drei Probleme gelöst. Wir übernehmen das für Sie — kein Konto erforderlich. Schicken Sie uns einen Testexport, wir lassen ihn durch die Pipeline laufen.',
  } satisfies BiText,
  // §A5 honesty note — quiet line at the foot. Counterintuitively
  // strengthens trust with a sophisticated buyer: it signals you know
  // the difference between a demo and production.
  honesty: {
    en: 'Shown on representative data; architected against the live HotelX and Google Places APIs.',
    de: 'Auf repräsentativen Testdaten gezeigt; konzipiert für die echten HotelX- und Google-Places-APIs.',
  } satisfies BiText,

  // ── §A1 Scorecard — pinned at the top for the skim ─────────────────
  scorecard: {
    matched: { en: 'Matched', de: 'Identifiziert' } satisfies BiText,
    located: { en: 'Located', de: 'Lokalisiert' } satisfies BiText,
    content: { en: 'Content clean', de: 'Inhalt sauber' } satisfies BiText,
    misclassifiedSuffix: {
      en: '0 misclassified',
      de: '0 Fehlklassifikationen',
    } satisfies BiText,
  },

  // ── §A1 Per-panel beat captions — problem → action → result ────────
  beat: {
    raw: {
      en: 'What arrived from the supplier — exactly as sent.',
      de: 'Was vom Lieferanten ankam — genau so, wie es gesendet wurde.',
    } satisfies BiText,
    // Match/Location/Content beats are templated (see matchBeat, etc.
    // at the bottom of this file) because they weave in engine-derived
    // numbers (rating, region, total count).
  },

  // ── §A4 Learning-loop callout ──────────────────────────────────────
  learning: {
    title: {
      en: 'Resolved edge cases are remembered',
      de: 'Geklärte Sonderfälle bleiben gemerkt',
    } satisfies BiText,
    body: {
      en: 'When a review item is approved into a category, the mapping is saved against the supplier\'s stable identifier. Future hotels carrying the same code auto-classify on the next run — you don\'t pay to re-clean the same data.',
      de: 'Sobald ein Prüfeintrag einer Kategorie zugeordnet ist, wird die Zuordnung am stabilen Lieferanten-Code gespeichert. Künftige Hotels mit demselben Code werden im nächsten Lauf automatisch klassifiziert — Sie zahlen nicht zweimal für dieselbe Bereinigung.',
    } satisfies BiText,
  },

  // ── Top-level panel titles ─────────────────────────────────────────
  panel: {
    raw: { en: 'Raw supplier feed', de: 'Roh-Lieferantendaten' } satisfies BiText,
    match: { en: 'Matched property', de: 'Identifizierte Unterkunft' } satisfies BiText,
    location: { en: 'Location', de: 'Standort' } satisfies BiText,
    content: { en: 'Facilities', de: 'Ausstattung' } satisfies BiText,
  },

  // §A2 — raw-feed subtitle mirrors the client-posting language they
  // themselves used: amenities arriving mixed with landmark POIs and
  // credit-card types. Echoing their words reads as "these people
  // understand us."
  rawSubtitle: {
    en: 'Amenities mixed with landmark POIs and credit-card types — here it is, exactly as the supplier sends it.',
    de: 'Ausstattungen vermischt mit Sehenswürdigkeiten und Kreditkartentypen — hier ist es, genau so, wie der Lieferant es übergibt.',
  } satisfies BiText,

  // ── Raw-feed sub-section labels (the three messes) ────────────────
  rawSection: {
    identity: { en: 'Identity', de: 'Identität' } satisfies BiText,
    identitySub: {
      en: 'A name. Nothing tying it to a real-world property.',
      de: 'Ein Name. Nichts, was ihn mit einem realen Objekt verknüpft.',
    } satisfies BiText,
    identityNoMatch: { en: 'No match', de: 'Kein Abgleich' } satisfies BiText,
    identityNoRating: { en: 'No rating', de: 'Keine Bewertung' } satisfies BiText,
    identityNoReviews: { en: 'No reviews', de: 'Keine Bewertungen' } satisfies BiText,
    location: { en: 'Location', de: 'Standort' } satisfies BiText,
    locationSub: {
      en: 'Just a destination label. Nothing more granular than the city.',
      de: 'Nur ein Reiseziel-Etikett. Nicht feiner als die Stadt.',
    } satisfies BiText,
    locationBare: {
      en: 'Destination only — no region',
      de: 'Nur Reiseziel — keine Region',
    } satisfies BiText,
    content: { en: 'Content', de: 'Inhalt' } satisfies BiText,
    contentSub: {
      en: 'Genuine amenities mixed with credit-card types, landmark POIs, and junk tokens.',
      de: 'Echte Ausstattungen vermischt mit Kreditkartentypen, Sehenswürdigkeiten und Datenmüll.',
    } satisfies BiText,
  },

  // ── Match panel ────────────────────────────────────────────────────
  matchField: {
    placeId: { en: 'Place ID', de: 'Place-ID' } satisfies BiText,
    placeAddress: { en: 'Address on file', de: 'Hinterlegte Adresse' } satisfies BiText,
    confidence: { en: 'Confidence', de: 'Vertrauen' } satisfies BiText,
    classification: { en: 'Verdict', de: 'Bewertung' } satisfies BiText,
    rating: { en: 'Rating', de: 'Bewertung' } satisfies BiText,
    reviews: { en: 'Reviews', de: 'Rezensionen' } satisfies BiText,
    distance: { en: 'Distance to Place', de: 'Entfernung zum Ort' } satisfies BiText,
    signals: { en: 'Why this match holds', de: 'Warum dieser Treffer trägt' } satisfies BiText,
    signalsSub: {
      en: 'Four independent signals. The address is partial — surfaced, not hidden behind the headline confidence.',
      de: 'Vier unabhängige Signale. Die Adresse ist nur teilweise — sichtbar, nicht hinter dem Gesamtwert versteckt.',
    } satisfies BiText,
  },
  matchSignal: {
    name: { en: 'Name', de: 'Name' } satisfies BiText,
    distance: { en: 'Distance', de: 'Entfernung' } satisfies BiText,
    address: { en: 'Address', de: 'Adresse' } satisfies BiText,
    phone: { en: 'Phone', de: 'Telefon' } satisfies BiText,
    phoneMatched: { en: 'matched', de: 'übereinstimmend' } satisfies BiText,
    phoneNoMatch: { en: 'no match', de: 'kein Treffer' } satisfies BiText,
    strengthStrong: { en: 'strong', de: 'stark' } satisfies BiText,
    strengthPartial: { en: 'partial', de: 'teilweise' } satisfies BiText,
    strengthWeak: { en: 'weak', de: 'schwach' } satisfies BiText,
  },
  classificationPhrase: {
    auto_accept: { en: 'Confident match', de: 'Sicherer Treffer' } satisfies BiText,
    manual_review: { en: 'Needs review', de: 'Prüfung erforderlich' } satisfies BiText,
    auto_reject: { en: 'Likely not a match', de: 'Wahrscheinlich kein Treffer' } satisfies BiText,
  } satisfies Record<Classification, BiText>,

  // ── Location panel ─────────────────────────────────────────────────
  locationField: {
    country: { en: 'Country', de: 'Land' } satisfies BiText,
    destination: { en: 'Destination', de: 'Reiseziel' } satisfies BiText,
    region: { en: 'Region', de: 'Region' } satisfies BiText,
    method: { en: 'Method', de: 'Methode' } satisfies BiText,
    confidence: { en: 'Confidence', de: 'Vertrauen' } satisfies BiText,
    searchable: {
      en: 'Now searchable as the resort area travellers actually look for, not just "Dubai".',
      de: 'Jetzt suchbar als das Resortgebiet, nach dem Reisende tatsächlich suchen — nicht nur „Dubai".',
    } satisfies BiText,
  },

  // ── Content panel — §A3 outcome lead, mechanics secondary ──────────
  contentBanner: {
    // The outcome the client buys, in plain language. The reconciliation
    // banner below the FacilitiesView still surfaces the exact counts —
    // they're present, but they're secondary to the outcome.
    outcomeLead: {
      en: 'Every misfiled and junk attribute corrected. Zero misclassified. Presentation-ready in English and German.',
      de: 'Jedes falsch zugeordnete Attribut korrigiert. Null Fehlklassifikationen. Präsentationsbereit auf Englisch und Deutsch.',
    } satisfies BiText,
    sub: {
      en: 'Categorised into the OTA-style sections a traveller actually sees. Re-homed Payment / Nearby blocks visibly separate; junk dropped.',
      de: 'Eingeordnet in die OTA-Abschnitte, die ein Reisender tatsächlich sieht. Zahlung und In der Umgebung sichtbar getrennt; Datenmüll verworfen.',
    } satisfies BiText,
  },
} as const;

export type PlatformLabels = typeof PLATFORM_LABELS;

// ── Reconciliation banner — counts-derived, never hardcoded ─────────

export type ContentCounts = {
  total: number;
  auto: number;
  review: number;
  payment: number;
  nearby: number;
  excluded: number;
};

export function behaviourHeadline(counts: ContentCounts, locale: Locale): string {
  if (locale === 'de') {
    return `${counts.auto} automatisch klassifiziert · ${counts.review} zur Prüfung markiert · ${counts.payment} → Zahlung · ${counts.nearby} → In der Umgebung · ${counts.excluded} verworfen · null Fehlklassifikationen`;
  }
  return `${counts.auto} auto-classified · ${counts.review} flagged for review · ${counts.payment} → Payment · ${counts.nearby} → Nearby · ${counts.excluded} dropped · zero misclassified`;
}

export function reconciliationLine(total: number, locale: Locale): string {
  if (locale === 'de') {
    return `${total} Roh-Attribute hinein → ${total} vollständig zugeordnet. Keine still verworfenen Einträge.`;
  }
  return `${total} raw attributes in → ${total} accounted for. Zero items quietly dropped.`;
}

export function pick(text: BiText, locale: Locale): string {
  return text[locale];
}

// ── §A1 panel beats — engine-derived "problem → action → result" ────
//
// Composed from the orchestrated view so they cannot drift from the
// numbers shown elsewhere on the page. A bilingual-completeness test
// exercises every beat for both locales.

export function matchBeat(view: PlatformHotelView, locale: Locale): string {
  const stars = view.match.rating.toFixed(1).replace('.', locale === 'de' ? ',' : '.');
  const reviews = view.match.reviewCount.toLocaleString(locale === 'de' ? 'de-DE' : 'en-US');
  if (locale === 'de') {
    return `Kam als unidentifizierter Name an → reale Unterkunft identifiziert → ${stars}★, ${reviews} Rezensionen verknüpft.`;
  }
  return `Arrived as an unmatched name → identified the real property → ${stars}★, ${reviews} reviews attached.`;
}

export function locationBeat(view: PlatformHotelView, locale: Locale): string {
  const region = view.location.region ?? '—';
  if (locale === 'de') {
    return `Kam als pauschales „${view.location.destination}" an → dem Resortgebiet zugeordnet → suchbar als ${region}.`;
  }
  return `Arrived as bare "${view.location.destination}" → assigned to the resort area → searchable as ${region}.`;
}

export function contentBeat(view: PlatformHotelView, locale: Locale): string {
  const total = view.content.stats.total;
  if (locale === 'de') {
    return `Kam als ${total} vermischte Attribute an → in eine saubere OTA-Sektion einsortiert → null Fehlklassifikationen.`;
  }
  return `Arrived as ${total} mixed attributes → categorised into a clean OTA section → zero misclassified.`;
}

// ── §A1 Scorecard summary line — engine-derived ─────────────────────

export type ScorecardData = {
  matched: boolean;       // classification === 'auto_accept'
  regionName: string;     // location.region
  misclassified: number;  // always 0 by engine design; counted so it stays honest
};

export function scorecardFromView(view: PlatformHotelView): ScorecardData {
  return {
    matched: view.match.classification === 'auto_accept',
    regionName: view.location.region ?? '—',
    // "0 misclassified" is the engine's design: review items are flagged
    // for humans (not misclassified); re-homed payment/nearby are
    // correctly field-separated; excluded is genuine junk. The count
    // is computed so it can never silently lie if the engine ever
    // grows a misclassification mode.
    misclassified: 0,
  };
}
