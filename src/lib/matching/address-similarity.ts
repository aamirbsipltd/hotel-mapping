import { tokenize } from './name-similarity';

/**
 * Address similarity using token overlap. Street number tokens are
 * highly diagnostic — a matching number gets a 0.15 bonus.
 */
export function addressSimilarity(a: string, b: string): number {
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const numbersA = new Set(tokensA.filter((t) => /^\d+$/.test(t)));
  const numbersB = new Set(tokensB.filter((t) => /^\d+$/.test(t)));
  const hasNumberMatch = [...numbersA].some((n) => numbersB.has(n));

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const intersection = [...setA].filter((t) => setB.has(t)).length;
  const union = new Set([...setA, ...setB]).size;
  const baseRatio = intersection / union;

  return hasNumberMatch ? Math.min(1, baseRatio + 0.15) : baseRatio;
}
