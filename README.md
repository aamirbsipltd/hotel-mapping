# Hotel Mapping Tool

Map your hotel inventory CSV to Tripadvisor Location IDs with transparent confidence scoring and a one-click review queue for ambiguous matches.

**Live:** [hotelmappingtool.com](https://hotelmappingtool.com)

---

## What it does

Upload a CSV of your hotels (name and city required; lat/lng and address improve accuracy). The tool:

1. Queries the Tripadvisor Content API for each hotel
2. Scores every candidate on four signals: name similarity, geographic distance, address overlap, and phone match
3. Auto-accepts high-confidence matches (≥85%), flags the rest for manual review
4. Returns a mapped CSV with `tripadvisor_location_id`, `confidence_score`, and `match_status` appended to your original columns

Free for the first 10 rows. Pro ($99 one-time) removes the limit.

---

## Scoring

Four signals, weighted and combined:

| Signal | Weight | Method |
|---|---|---|
| Name similarity | 45% | Token-set ratio (Jaccard) + Levenshtein, diacritics and suffixes stripped |
| Geographic distance | 30% | Haversine, cliff at 0.1 km, decay to 5 km |
| Address overlap | 20% | Token intersection + street-number match bonus |
| Phone | 5% | Digit-normalised exact match |

Auto-accept threshold: **0.85**. Auto-reject: **0.55**. Everything in between enters the review queue.

See [docs/SCORING.md](docs/SCORING.md) for the full specification.

---

## Stack

- **Next.js 16** (App Router, server components)
- **Prisma 7** + Supabase Postgres (PrismaPg adapter)
- **Tailwind v4** CSS-first, OKLCH color space
- **shadcn/ui** base-nova
- **Zod 4** for all API boundary validation
- **papaparse** for CSV parsing

---

## Local development

```bash
# 1. Install dependencies
npm install

# 2. Copy env vars
cp .env.example .env
# Fill in DATABASE_URL, DIRECT_URL, TRIPADVISOR_API_KEY

# 3. Push schema
npm run db:migrate

# 4. Start dev server
npm run dev
```

### Required environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase pooled connection string |
| `DIRECT_URL` | Supabase direct connection string (for migrations) |
| `TRIPADVISOR_API_KEY` | Tripadvisor Content API key |
| `STRIPE_SECRET_KEY` | Stripe secret key (Pro unlock) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `DEMO_ROW_LIMIT` | Rows processed in demo mode (default: 10) |

---

## Scripts

```bash
npm test                 # Run scoring unit tests (19 tests)
npm run smoke            # Smoke-test scoring on 20-hotel fixture
npm run validate-mocks   # Validate mock API responses against Zod schemas
npm run db:migrate       # Push Prisma schema to database
npm run db:studio        # Open Prisma Studio
```

---

## Tripadvisor compliance

Ratings and review counts are displayed using Tripadvisor's own bubble-rating images, adjacent to the Tripadvisor owl logo, with a direct link back to the property page. Review data is cached for 24 hours per location. This is required by Tripadvisor's Content API display guidelines.

---

## Deployment

Deployed on Vercel. The `vercel-build` script runs `prisma generate && next build`.

Set all environment variables in the Vercel project settings before deploying.

---

## Region mapping — production storage path

The default region-assignment engine uses pure JS (`turf` + `rbush`) and
stores polygons as serialised GeoJSON in a TEXT column. That's portable
(SQLite dev, Postgres prod, browser) and good enough for tens of
thousands of hotels against a few hundred regions. It also keeps the
demo and CI dependency-free.

The scale-up path, for when inventory volume or region count grows:

| Default (built) | Scale path (documented) |
|---|---|
| `polygon TEXT` (serialised GeoJSON) | `polygon geometry(MultiPolygon, 4326)` |
| `bbox TEXT` (serialised `[minLng,minLat,maxLng,maxLat]`) | GIST spatial index on `polygon` |
| `turf.booleanPointInPolygon` | `ST_Contains(polygon, ST_MakePoint(lng, lat))` |
| `haversineKm` against centroid for fallback | `ST_DWithin(polygon, point, radius_metres)` |

Notes on the migration:

- This is **the same Postgres migration** owed for the FastX and matcher
  modules — column-type changes for the region polygons land alongside
  the broader `db push` → `prisma migrate deploy` cut-over and the
  `DIRECT_URL` wiring.
- The portable engine is the default; PostGIS is the bigger-data
  acceleration, not a replacement. Region create/edit, point-in-polygon
  routing, and the four engine guards all remain logically the same;
  only the storage and query primitives change.
- OSM imports go through `@turf/simplify` on the way in
  (`scripts/osm-region-import.ts`) so the polygons stay small enough
  that the JS engine remains viable longer than naïve geometry would
  suggest.
