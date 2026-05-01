import { nameSimilarity } from './name-similarity';
import { haversineKm, distanceScore } from './geo-distance';
import { addressSimilarity } from './address-similarity';

export type SourceHotel = {
  id: string;
  name: string;
  city?: string;
  country?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
};

export type CandidateHotel = {
  locationId: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
};

export type ScoreBreakdown = {
  nameScore: number;
  distanceKm: number | null;
  distanceScore: number;
  addressScore: number;
  phoneMatch: boolean;
  weights: { name: number; distance: number; address: number; phone: number };
  totalScore: number;
};

export type Classification = 'auto_accept' | 'manual_review' | 'auto_reject';

export type ScoredMatch = {
  source: SourceHotel;
  candidate: CandidateHotel;
  breakdown: ScoreBreakdown;
  classification: Classification;
};

export const DEFAULT_WEIGHTS = {
  name: 0.45,
  distance: 0.30,
  address: 0.20,
  phone: 0.05,
};

export const AUTO_ACCEPT_THRESHOLD = 0.85;
export const AUTO_REJECT_THRESHOLD = 0.55;

export function scoreMatch(
  source: SourceHotel,
  candidate: CandidateHotel,
  weights = DEFAULT_WEIGHTS,
): ScoreBreakdown {
  const nameScore = nameSimilarity(source.name, candidate.name);

  let distanceKm: number | null = null;
  let distScore = 0;
  if (
    source.latitude != null &&
    source.longitude != null &&
    candidate.latitude != null &&
    candidate.longitude != null
  ) {
    distanceKm = haversineKm(
      source.latitude, source.longitude,
      candidate.latitude, candidate.longitude,
    );
    distScore = distanceScore(distanceKm);
  }

  const addrScore =
    source.address && candidate.address
      ? addressSimilarity(source.address, candidate.address)
      : 0;

  const sourcePhone = source.phone?.replace(/\D/g, '') ?? '';
  const candPhone = candidate.phone?.replace(/\D/g, '') ?? '';
  const phoneMatch =
    sourcePhone.length >= 7 &&
    candPhone.length >= 7 &&
    sourcePhone.endsWith(candPhone.slice(-7));

  // Re-normalise weights for present components so missing data doesn't
  // artificially suppress the score.
  const components: Array<[keyof typeof weights, number, boolean]> = [
    ['name', nameScore, true],
    ['distance', distScore, distanceKm !== null],
    ['address', addrScore, !!source.address && !!candidate.address],
    ['phone', phoneMatch ? 1 : 0, phoneMatch],
  ];

  const activeWeight = components
    .filter(([, , present]) => present)
    .reduce((sum, [key]) => sum + weights[key], 0);

  const totalScore = activeWeight > 0
    ? components
        .filter(([, , present]) => present)
        .reduce((sum, [key, score]) => sum + (weights[key] / activeWeight) * score, 0)
    : 0;

  return {
    nameScore,
    distanceKm,
    distanceScore: distScore,
    addressScore: addrScore,
    phoneMatch,
    weights,
    totalScore,
  };
}

export function classify(score: number): Classification {
  if (score >= AUTO_ACCEPT_THRESHOLD) return 'auto_accept';
  if (score >= AUTO_REJECT_THRESHOLD) return 'manual_review';
  return 'auto_reject';
}

export function rankCandidates(
  source: SourceHotel,
  candidates: CandidateHotel[],
): ScoredMatch[] {
  return candidates
    .map((candidate) => {
      const breakdown = scoreMatch(source, candidate);
      return {
        source,
        candidate,
        breakdown,
        classification: classify(breakdown.totalScore),
      };
    })
    .sort((a, b) => b.breakdown.totalScore - a.breakdown.totalScore);
}
