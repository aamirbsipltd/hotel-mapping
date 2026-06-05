// Stage 0 — field triage.
//
// Walks the HotelData and emits a flat list of RawItem rows. The point of
// this stage is field separation: cardTypes get sourceField='cardTypes'
// and POI descriptions get sourceField='poi' so the rest of the pipeline
// (and downstream renderer) never has to wonder whether a "Burj Khalifa"
// string is an amenity or supplier noise. allAmenities edges flow through
// as sourceField='amenity' and continue into Stages 1–4.

import type {
  HotelData,
  HotelXAmenityData,
  Description,
} from '../hotelx-types';
import type { Locale } from '../taxonomy';
import { nonEmpty } from './normalize';
import type { RawItem } from './types';

const LOCALE_MAP: Record<string, Locale> = { EN: 'en', DE: 'de' };

function extractTexts(
  texts: HotelXAmenityData['texts'] | undefined,
): Partial<Record<Locale, string>> {
  const out: Partial<Record<Locale, string>> = {};
  if (!texts) return out;
  for (const t of texts) {
    const loc = LOCALE_MAP[t.language?.toUpperCase()];
    if (loc && nonEmpty(t.text)) out[loc] = t.text.trim();
  }
  return out;
}

function pickRawText(texts: Partial<Record<Locale, string>>): string {
  return texts.en ?? texts.de ?? '';
}

function amenityToRaw(a: HotelXAmenityData): RawItem | null {
  const texts = extractTexts(a.texts);
  const rawText = pickRawText(texts);

  const giataCode = a.mappings?.find((m) => m.context === 'GIATA')?.code;

  // An amenity node with no text, no canonical/supplier code, and no GIATA
  // mapping has nothing the pipeline can route — drop it at Stage 0 rather
  // than emitting a phantom "" row.
  if (!rawText && !a.code && !a.amenityCode && !giataCode) return null;

  return {
    rawText: rawText || a.amenityCode || a.code || '',
    texts,
    canonicalCode: a.code,
    supplierCode: a.amenityCode,
    giataCode,
    applicationType: a.type,
    sourceField: 'amenity',
  };
}

function cardToRaw(cardCode: string): RawItem {
  return {
    rawText: cardCode,
    texts: { en: cardCode, de: cardCode },
    supplierCode: cardCode,
    sourceField: 'cardTypes',
  };
}

function poiDescriptionToRaw(d: Description): RawItem | null {
  if (!nonEmpty(d.text)) return null;
  const loc = LOCALE_MAP[d.language?.toUpperCase()] ?? 'en';
  const texts: Partial<Record<Locale, string>> = {};
  texts[loc] = d.text.trim();
  return {
    rawText: d.text.trim(),
    texts,
    sourceField: 'poi',
  };
}

export function triage(hotel: HotelData): RawItem[] {
  const items: RawItem[] = [];

  for (const card of hotel.cardTypes ?? []) {
    if (nonEmpty(card.code)) items.push(cardToRaw(card.code));
  }

  for (const edge of hotel.allAmenities?.edges ?? []) {
    const r = amenityToRaw(edge.node.amenityData);
    if (r) items.push(r);
  }

  for (const d of hotel.descriptions ?? []) {
    if (d.type === 'POI') {
      const r = poiDescriptionToRaw(d);
      if (r) items.push(r);
    }
  }

  return items;
}
