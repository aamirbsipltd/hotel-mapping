// Platform orchestrator.
//
// Calls the three real pipelines (matcher, region, FastX) and assembles
// a single PlatformHotelView for the canonical hotel. There is NO
// classifier, NO scorer, NO assigner re-implemented here — each slice
// is the verbatim output of the module that owns it. The integration
// test in ./platform.test.ts pins this with deep-equals against the
// modules' own canonical outputs.
//
// Pipelines called (reused, named in the PR):
//   • Matcher: rankCandidates + classify from src/lib/matching/score.ts
//   • Region: buildRegionIndex + assign from src/regions/assign/
//   • FastX:  getDemoClassification from src/fastx/demo/compute.ts
//             (which itself wraps classifyHotel from src/fastx/classify/)

import { rankCandidates, classify, AUTO_ACCEPT_THRESHOLD, type Classification } from '@/lib/matching/score';
import { haversineKm } from '@/lib/matching/geo-distance';
import type { ClassifyResult, ClassifyStats } from '@/fastx/classify/types';
import { getDemoClassification } from '@/fastx/demo/compute';
import { prepareFacilitiesView } from '@/fastx/ota/prepare-view';
import type { FacilitiesView } from '@/fastx/ota/facilities-section';
import { buildRegionIndex, assign, type AssignmentResult, type IndexedRegion } from '@/regions/assign';
import { SEED_REGIONS } from '@/regions/seed/regions';
import { seedToRegionInput } from '@/regions/seed/to-region-input';
import { SEED_DESTINATIONS } from '@/regions/seed/destinations';
import { SEED_COUNTRIES } from '@/regions/seed/countries';
import { canonicalHotel, type CanonicalHotel } from './fixtures/canonical-hotel';
import { toMatcherCandidate, toMatcherSource } from './adapters/to-matcher';
import { toRegionPoint } from './adapters/to-region';

export type PlatformMatch = {
  placeId: string;
  placeName: string;
  placeAddress: string;
  confidence: number;          // matcher's totalScore, 0..1
  classification: Classification;
  rating: number;
  reviewCount: number;
  distanceKm: number | null;   // distance between supplier and Place coords
  signals: {
    nameScore: number;
    distanceScore: number;
    addressScore: number;
    phoneMatch: boolean;
  };
};

export type PlatformLocation = {
  country: string;
  countryCode: string;
  destination: string;
  destinationSlug: string;
  region: string | null;
  regionSlug: string | null;
  route: AssignmentResult['route'];
  method: AssignmentResult['method'];
  confidence: number;
  distanceKm: number | null;
};

export type PlatformContent = {
  stats: ClassifyStats;
  view: FacilitiesView;
  // Full snapshot — used by the integration test and any downstream
  // consumer that needs the per-item breakdown.
  result: ClassifyResult;
};

export type PlatformHotelView = {
  hotel: {
    key: string;
    name: string;
    coords: CanonicalHotel['coords'];
    address: string;
    phone: string;
    city: string;
  };
  match: PlatformMatch;
  location: PlatformLocation;
  content: PlatformContent;
};

// Built once at module load. The region index is pure-function output
// over the committed seed — no DB, no env. Deterministic across calls.
let cachedIndex: ReturnType<typeof buildRegionIndex> | null = null;
function getRegionIndex() {
  if (cachedIndex) return cachedIndex;
  cachedIndex = buildRegionIndex(SEED_REGIONS.map(seedToRegionInput));
  return cachedIndex;
}

function regionDetails(regionId: string | null, index: ReturnType<typeof buildRegionIndex>): IndexedRegion | null {
  if (!regionId) return null;
  return index.regions.find((r) => r.id === regionId) ?? null;
}

function destinationName(slug: string | null): string {
  if (!slug) return canonicalHotel.city;
  return SEED_DESTINATIONS.find((d) => d.slug === slug)?.name ?? canonicalHotel.city;
}

function countryName(slug: string | null): { name: string; code: string } {
  const dest = SEED_DESTINATIONS.find((d) => d.slug === slug);
  const country = dest && SEED_COUNTRIES.find((c) => c.code === dest.countryCode);
  if (!country) {
    return { name: canonicalHotel.country, code: canonicalHotel.countryCode };
  }
  return { name: country.name, code: country.code };
}

// Distance reuses the matcher's haversine (src/lib/matching/geo-distance.ts).
// No third distance implementation lives in the platform module.
function metresBetween(a: CanonicalHotel['coords'], b: CanonicalHotel['coords']): number {
  return haversineKm(a.lat, a.lng, b.lat, b.lng);
}

export function orchestrateCanonical(): PlatformHotelView {
  const h = canonicalHotel;

  // ── Matcher slice ───────────────────────────────────────────────────
  const source = toMatcherSource(h);
  const candidate = toMatcherCandidate(h.mockGooglePlace);
  const ranked = rankCandidates(source, [candidate]);
  const top = ranked[0];
  const distanceKm = metresBetween(h.coords, h.mockGooglePlace.coords);

  // ── Region slice ────────────────────────────────────────────────────
  const index = getRegionIndex();
  const regionResult = assign(toRegionPoint(h), index);
  const region = regionDetails(regionResult.regionId, index);
  const destSlug = region?.destinationSlug ?? 'dubai';
  const country = countryName(destSlug);

  // ── FastX slice ─────────────────────────────────────────────────────
  const fastx = getDemoClassification(h.hotelKey);
  const view = prepareFacilitiesView(fastx.result);

  // ── Assemble ────────────────────────────────────────────────────────
  return {
    hotel: {
      key: h.hotelKey,
      name: h.name,
      coords: h.coords,
      address: h.address,
      phone: h.phone,
      city: h.city,
    },
    match: {
      placeId: top.candidate.locationId,
      placeName: top.candidate.name,
      placeAddress: top.candidate.address ?? '',
      confidence: top.breakdown.totalScore,
      classification: classify(top.breakdown.totalScore),
      rating: h.mockGooglePlace.rating,
      reviewCount: h.mockGooglePlace.reviewCount,
      distanceKm,
      signals: {
        nameScore: top.breakdown.nameScore,
        distanceScore: top.breakdown.distanceScore,
        addressScore: top.breakdown.addressScore,
        phoneMatch: top.breakdown.phoneMatch,
      },
    },
    location: {
      country: country.name,
      countryCode: country.code,
      destination: destinationName(destSlug),
      destinationSlug: destSlug,
      region: region?.name ?? null,
      regionSlug: region?.slug ?? null,
      route: regionResult.route,
      method: regionResult.method,
      confidence: regionResult.confidence,
      distanceKm: regionResult.distanceKm,
    },
    content: {
      stats: fastx.result.stats,
      view,
      result: fastx.result,
    },
  };
}

export { canonicalHotel };
export { AUTO_ACCEPT_THRESHOLD };
