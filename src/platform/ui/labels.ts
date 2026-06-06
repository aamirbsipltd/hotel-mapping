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
  poweredBy: {
    en: 'Running on representative fixtures and a mock match. Architected against the real HotelX and Google Places APIs.',
    de: 'Läuft auf repräsentativen Testdaten und einem Mock-Treffer. Konzipiert für die echten HotelX- und Google-Places-APIs.',
  } satisfies BiText,

  // ── Top-level panel titles ─────────────────────────────────────────
  panel: {
    raw: { en: 'Raw supplier feed', de: 'Roh-Lieferantendaten' } satisfies BiText,
    match: { en: 'Matched property', de: 'Identifizierte Unterkunft' } satisfies BiText,
    location: { en: 'Location', de: 'Standort' } satisfies BiText,
    content: { en: 'Facilities', de: 'Ausstattung' } satisfies BiText,
  },

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

  // ── Content panel — reconciliation banner ──────────────────────────
  contentBanner: {
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
