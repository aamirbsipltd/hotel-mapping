export function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost,
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

export function levenshteinSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

const STOPWORDS = new Set(['the', 'a', 'an', 'of', 'in', 'at', 'and', '&', 'by']);

export const HOTEL_SUFFIXES = new Set([
  'hotel', 'hotels', 'resort', 'resorts', 'inn', 'lodge', 'suites',
  'apartments', 'residence', 'residences', 'palace', 'plaza', 'house',
  'tower', 'towers', 'spa', 'club', 'group', 'collection',
]);

export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .filter((t) => !STOPWORDS.has(t));
}

export function tokenSetRatio(a: string, b: string): number {
  const tokensA = new Set(tokenize(a).filter((t) => !HOTEL_SUFFIXES.has(t)));
  const tokensB = new Set(tokenize(b).filter((t) => !HOTEL_SUFFIXES.has(t)));

  if (tokensA.size === 0 && tokensB.size === 0) return 1;
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  const intersection = [...tokensA].filter((t) => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  return intersection / union;
}

/**
 * Token-set ratio carries 75% of the weight because hotels with the same
 * content tokens but different word order (e.g. "Grand Hotel Lisbon" vs
 * "Lisbon Grand Hotel") are the same property. Levenshtein scores these
 * poorly, so we keep it as a minority signal for typo detection only.
 */
export function nameSimilarity(a: string, b: string): number {
  const lev = levenshteinSimilarity(a, b);
  const tsr = tokenSetRatio(a, b);
  return 0.25 * lev + 0.75 * tsr;
}
