// Stage 2 — fuzzy lexicon scoring.
//
// Reuses the hotel matcher's similarity primitives — `tokenize` and
// `levenshteinSimilarity` from `src/lib/matching/name-similarity.ts`.
// No parallel similarity function lives here; this module only stacks
// those primitives into a lexicon-aware aggregate per category.
//
// Scoring rules per lexicon entry vs candidate rawText:
//   • All entry tokens present in candidate tokens → strong match
//     scaled by entry length so multi-word phrases beat single-word hits.
//     "rooftop pool" (2 tokens) > "pool" (1 token) when both fit.
//   • Otherwise: best per-token Levenshtein similarity, scaled down so a
//     fuzzy single-token brush never auto-classifies on its own.
// Category score = max over its lexicon entries × type-prior bonus.

import { tokenize, levenshteinSimilarity } from '@/lib/matching/name-similarity';
import { LEXICONS, TYPE_PRIORS } from '../mapping/lexicons';
import type { CategoryId } from '../taxonomy';
import { ORDERED_CATEGORY_IDS } from '../taxonomy';
import type { RawItem } from './types';

const SINGLE_WORD_PHRASE_SCORE = 0.6;
const TWO_WORD_PHRASE_SCORE = 0.88;
const MULTI_WORD_PHRASE_SCORE = 0.95;
const TOKEN_LEV_WEIGHT = 0.55;
const TYPE_PRIOR_BOOST = 1.05;
const TYPE_PRIOR_MAX = 0.96; // never push past auto threshold on prior alone

function phraseScore(termTokenCount: number): number {
  if (termTokenCount <= 1) return SINGLE_WORD_PHRASE_SCORE;
  if (termTokenCount === 2) return TWO_WORD_PHRASE_SCORE;
  return MULTI_WORD_PHRASE_SCORE;
}

function scoreAgainstLexicon(candTokens: Set<string>, lexicon: string[]): number {
  if (candTokens.size === 0) return 0;
  let best = 0;
  for (const term of lexicon) {
    const termTokens = tokenize(term);
    if (termTokens.length === 0) continue;

    if (termTokens.every((t) => candTokens.has(t))) {
      const s = phraseScore(termTokens.length);
      if (s > best) best = s;
      continue;
    }

    for (const tt of termTokens) {
      for (const ct of candTokens) {
        if (ct === tt) {
          if (SINGLE_WORD_PHRASE_SCORE > best) best = SINGLE_WORD_PHRASE_SCORE;
        } else {
          const lev = levenshteinSimilarity(ct, tt);
          const s = TOKEN_LEV_WEIGHT * lev;
          if (s > best) best = s;
        }
      }
    }
  }
  return best;
}

export type FuzzyResult = {
  categoryId: CategoryId;
  confidence: number;
  perCategory: Record<CategoryId, number>;
};

export function scoreFuzzy(item: RawItem): FuzzyResult | null {
  const candTokens = new Set(tokenize(item.rawText));
  if (candTokens.size === 0) return null;

  const priorCategories = item.applicationType
    ? TYPE_PRIORS[item.applicationType] ?? []
    : [];

  const perCategory: Partial<Record<CategoryId, number>> = {};
  let bestId: CategoryId | null = null;
  let bestScore = 0;

  for (const id of ORDERED_CATEGORY_IDS) {
    const raw = scoreAgainstLexicon(candTokens, LEXICONS[id]);
    const boosted = priorCategories.includes(id)
      ? Math.min(TYPE_PRIOR_MAX, raw * TYPE_PRIOR_BOOST)
      : raw;
    perCategory[id] = boosted;
    if (boosted > bestScore) {
      bestScore = boosted;
      bestId = id;
    }
  }

  if (!bestId || bestScore <= 0) return null;

  const full: Record<CategoryId, number> = ORDERED_CATEGORY_IDS.reduce(
    (acc, id) => {
      acc[id] = perCategory[id] ?? 0;
      return acc;
    },
    {} as Record<CategoryId, number>,
  );

  return { categoryId: bestId, confidence: bestScore, perCategory: full };
}
