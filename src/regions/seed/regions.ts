// Seed region polygons — approximate, hand-authored from public coordinate
// references. These are starting points that the admin workbench (Phase 2)
// will refine in-editor; clean OSM/Overpass boundaries (Phase 4 import
// utility) replace those that have formal admin geometry. NOT survey-
// accurate. Production usage should refine each polygon in the editor.
//
// Coordinate order is GeoJSON [longitude, latitude]. Vertices walk the
// outer ring counter-clockwise where possible (turf doesn't require it for
// boundedness, but it keeps the polygons readable).
//
// Two regions in this seed are designed to overlap on purpose:
//   Dubai Marina ↔ JBR — these are contiguous in reality (JBR fronts the
//   beach end of the Marina). A hotel placed in the strip between them is
//   the multi-match canary the Phase 1 engine routes to review.

import type { SeedRegion } from '../types';
import { polygonFromRing } from '../geo/coords';

// ── Dubai ───────────────────────────────────────────────────────────────────

const DUBAI_MARINA: SeedRegion = {
  slug: 'dubai-marina',
  name: 'Dubai Marina',
  destinationSlug: 'dubai',
  source: 'SEED',
  note: 'Approximate. Refine in the admin editor or import from Overpass.',
  polygon: polygonFromRing([
    [55.125, 25.060],
    [55.150, 25.060],
    [55.150, 25.095],
    [55.125, 25.095],
  ]),
};

// JBR (Jumeirah Beach Residence) — beach strip east of the Marina, fronting
// the Gulf. JBR's western edge overlaps the Marina's eastern edge along a
// narrow strip (lng 55.145–55.150) — this is the deliberate multi-match
// canary the Phase 1 engine routes to review.
const JBR: SeedRegion = {
  slug: 'jbr',
  name: 'Jumeirah Beach Residence',
  destinationSlug: 'dubai',
  source: 'SEED',
  note: 'Approximate. Overlaps Dubai Marina on a ~500 m strip near the beach on purpose.',
  polygon: polygonFromRing([
    [55.145, 25.066],
    [55.175, 25.066],
    [55.175, 25.085],
    [55.145, 25.085],
  ]),
};

const PALM_JUMEIRAH: SeedRegion = {
  slug: 'palm-jumeirah',
  name: 'Palm Jumeirah',
  destinationSlug: 'dubai',
  source: 'SEED',
  note: 'Approximate bounding box around the man-made island. Real shape is fan-and-fronds; refine in editor.',
  polygon: polygonFromRing([
    [55.115, 25.100],
    [55.165, 25.100],
    [55.165, 25.130],
    [55.115, 25.130],
  ]),
};

const DOWNTOWN_DUBAI: SeedRegion = {
  slug: 'downtown-dubai',
  name: 'Downtown Dubai',
  destinationSlug: 'dubai',
  source: 'SEED',
  note: 'Approximate. Burj Khalifa / Dubai Mall area.',
  polygon: polygonFromRing([
    [55.260, 25.180],
    [55.290, 25.180],
    [55.290, 25.205],
    [55.260, 25.205],
  ]),
};

const BUSINESS_BAY: SeedRegion = {
  slug: 'business-bay',
  name: 'Business Bay',
  destinationSlug: 'dubai',
  source: 'SEED',
  note: 'Approximate. South of Downtown along the Water Canal. Top edge abuts Downtown but does not overlap.',
  polygon: polygonFromRing([
    [55.255, 25.160],
    [55.280, 25.160],
    [55.280, 25.179],
    [55.255, 25.179],
  ]),
};

const DEIRA: SeedRegion = {
  slug: 'deira',
  name: 'Deira',
  destinationSlug: 'dubai',
  source: 'SEED',
  note: 'Approximate. North of the Creek.',
  polygon: polygonFromRing([
    [55.290, 25.255],
    [55.340, 25.255],
    [55.340, 25.290],
    [55.290, 25.290],
  ]),
};

const AL_BARSHA: SeedRegion = {
  slug: 'al-barsha',
  name: 'Al Barsha',
  destinationSlug: 'dubai',
  source: 'SEED',
  note: 'Approximate. Around Mall of the Emirates.',
  polygon: polygonFromRing([
    [55.190, 25.095],
    [55.220, 25.095],
    [55.220, 25.120],
    [55.190, 25.120],
  ]),
};

// ── Mallorca ─────────────────────────────────────────────────────────────────

const PLAYA_DE_PALMA: SeedRegion = {
  slug: 'playa-de-palma',
  name: 'Playa de Palma',
  destinationSlug: 'mallorca',
  source: 'SEED',
  note: 'Approximate. Beach strip south-east of Palma.',
  polygon: polygonFromRing([
    [2.725, 39.500],
    [2.770, 39.500],
    [2.770, 39.525],
    [2.725, 39.525],
  ]),
};

const MAGALUF: SeedRegion = {
  slug: 'magaluf',
  name: 'Magaluf',
  destinationSlug: 'mallorca',
  source: 'SEED',
  note: 'Approximate. Calvià municipality, south-west coast.',
  polygon: polygonFromRing([
    [2.515, 39.500],
    [2.545, 39.500],
    [2.545, 39.520],
    [2.515, 39.520],
  ]),
};

const SANTA_PONSA: SeedRegion = {
  slug: 'santa-ponsa',
  name: 'Santa Ponsa',
  destinationSlug: 'mallorca',
  source: 'SEED',
  note: 'Approximate. Calvià municipality, west of Magaluf.',
  polygon: polygonFromRing([
    [2.470, 39.505],
    [2.495, 39.505],
    [2.495, 39.525],
    [2.470, 39.525],
  ]),
};

const ALCUDIA: SeedRegion = {
  slug: 'alcudia',
  name: 'Alcúdia',
  destinationSlug: 'mallorca',
  source: 'SEED',
  note: 'Approximate. North-east coast, Bay of Alcúdia.',
  polygon: polygonFromRing([
    [3.105, 39.840],
    [3.140, 39.840],
    [3.140, 39.870],
    [3.105, 39.870],
  ]),
};

const CALA_MILLOR: SeedRegion = {
  slug: 'cala-millor',
  name: 'Cala Millor',
  destinationSlug: 'mallorca',
  source: 'SEED',
  note: 'Approximate. East coast, Son Servera / Sant Llorenç.',
  polygon: polygonFromRing([
    [3.370, 39.580],
    [3.395, 39.580],
    [3.395, 39.605],
    [3.370, 39.605],
  ]),
};

export const SEED_REGIONS: SeedRegion[] = [
  DUBAI_MARINA,
  JBR,
  PALM_JUMEIRAH,
  DOWNTOWN_DUBAI,
  BUSINESS_BAY,
  DEIRA,
  AL_BARSHA,
  PLAYA_DE_PALMA,
  MAGALUF,
  SANTA_PONSA,
  ALCUDIA,
  CALA_MILLOR,
];
