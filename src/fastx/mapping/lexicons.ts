// Per-category fuzzy lexicons.
//
// Used only by Stage 2 when Stage 1's exact dictionary misses. Entries are
// matched via `tokenize` + `levenshteinSimilarity` from
// `src/lib/matching/name-similarity.ts` — the same primitives the hotel
// matcher uses. See classify/fuzzy.ts for the scoring rules.
//
// Lexicon design notes:
// - Prefer multi-word phrases ("rooftop pool", "lobby bar") over single
//   generic words ("lounge", "club", "service") — single common words
//   match too many ambiguous candidates and pull edge cases over the
//   auto-classify threshold. The pipeline's review queue is the right
//   home for genuinely ambiguous text.
// - Cross-language note: amenity text from HotelX may arrive in EN or DE.
//   The mock fixtures' DE text is included via `texts[language=DE]` and
//   passes through Stage 0 as well, so DE keywords are useful too.

import type { CategoryId } from '../taxonomy';

export const LEXICONS: Record<CategoryId, string[]> = {
  internet: [
    'wifi',
    'wi-fi',
    'wireless internet',
    'free wifi',
    'free wi-fi',
    'internet access',
    'broadband',
    'wlan',
    'kostenloses wlan',
  ],
  pools: [
    'swimming pool',
    'outdoor pool',
    'indoor pool',
    'rooftop pool',
    'infinity pool',
    'plunge pool',
    'aussenpool',
    'innenpool',
    'pool',
  ],
  wellness_spa: [
    'spa',
    'sauna',
    'steam room',
    'massage',
    'jacuzzi',
    'hammam',
    'wellness',
    'hot tub',
    'thermal bath',
    'turkish bath',
    'wellnessbereich',
  ],
  food_drink: [
    'restaurant',
    'breakfast included',
    'continental breakfast',
    'buffet breakfast',
    'breakfast',
    'room service',
    'hotel bar',
    'lobby bar',
    'wine bar',
    'rooftop bar',
    'cafe',
    'café',
    'fruehstueck',
    'frühstück',
  ],
  transfers: [
    'airport transfer',
    'airport shuttle',
    'airport limousine',
    'shuttle service',
    'limousine service',
    'valet parking',
    'car service',
    'flughafentransfer',
  ],
  business: [
    'business centre',
    'business center',
    'meeting room',
    'conference room',
    'conference facilities',
    'coworking',
    'business services',
    'konferenzraum',
  ],
  family: [
    'kids club',
    'children club',
    'babysitting',
    'playground',
    'cot available',
    'crib available',
    'family friendly',
    'kinderclub',
  ],
  accessibility: [
    'wheelchair accessible',
    'wheelchair access',
    'accessible entrance',
    'elevator',
    'lift',
    'braille',
    'roll-in shower',
    'rollstuhlgerecht',
    'aufzug',
  ],
  languages: [
    'english',
    'german',
    'french',
    'spanish',
    'italian',
    'arabic',
    'mandarin',
    'englisch',
    'deutsch',
    'französisch',
    'arabisch',
  ],
  safety_security: [
    '24-hour security',
    '24 hour security',
    'cctv',
    'in-room safe',
    'in room safe',
    'smoke detector',
    'fire extinguisher',
    'sicherheitsdienst',
  ],
  general: [
    'air conditioning',
    'heating',
    'non-smoking',
    'non smoking',
    'flat-screen tv',
    'klimaanlage',
    'nichtraucher',
  ],
};

// Lightweight prior from amenityData.type. Categories listed in the prior
// for a given ApplicationAreaType get a small multiplier boost on their
// fuzzy score. Keeps Stage 2 honest when the candidate text is borderline
// between two plausible categories.
export const TYPE_PRIORS: Record<string, CategoryId[]> = {
  ROOM: ['general', 'safety_security', 'accessibility'],
  SERVICE: ['food_drink', 'business', 'transfers', 'family'],
  HOTEL: ['pools', 'wellness_spa', 'general'],
  GENERAL: ['internet', 'general'],
};
