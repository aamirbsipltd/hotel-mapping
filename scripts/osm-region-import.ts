// OSM / Overpass region-boundary importer.
//
// Standalone — runs outside the Next app. Two invocations:
//
//   node --conditions=react-server --import tsx scripts/osm-region-import.ts \
//       --slug dubai-marina --slug jbr --apply
//
//   tsx scripts/osm-region-import.ts --slug dubai-marina   # dry-run (default)
//
// In dry-run mode (default) the script fetches Overpass, runs the
// conversion + simplification + validation pipeline, and writes the
// resulting candidate GeoJSON files to src/regions/fixtures/osm/captured/.
// With --apply, the script additionally upserts the region polygon to
// the DB with source=OSM — but only if the existing row is SEED or OSM
// or absent. MANUAL rows are skipped (provenance rule, brief §11).
//
// Overpass usage policy (https://wiki.openstreetmap.org/wiki/Overpass_API):
//   • Throttle requests; the public instance enforces a usage policy.
//   • Cache responses (this script writes every fetch to disk for reuse).
//   • Set a meaningful User-Agent so the operator is reachable.
//
// Overpass name matching is fuzzy. Every candidate is logged — when there
// is more than one match, the script picks the first 'exact' match if one
// exists, otherwise reports all candidates and writes none (the operator
// confirms before re-running with --slug <slug> --osm-id <id>).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBoundaryQuery, fetchOverpass } from '../src/regions/osm/overpass-client';
import { convertOverpass, shouldApply } from '../src/regions/osm/overpass-to-region';
import { SEED_REGIONS } from '../src/regions/seed/regions';
import { SEED_DESTINATIONS } from '../src/regions/seed/destinations';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..');
const CAPTURED_DIR = resolve(REPO_ROOT, 'src/regions/fixtures/osm/captured');

function loadDotEnv(): void {
  const path = resolve(REPO_ROOT, '.env');
  if (!existsSync(path)) return;
  const text = readFileSync(path, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

type Args = {
  slugs: string[];
  apply: boolean;
  help: boolean;
  toleranceDeg?: number;
};

function parseArgs(argv: string[]): Args {
  const out: Args = { slugs: [], apply: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--apply') out.apply = true;
    else if (a === '--slug') out.slugs.push(argv[++i]);
    else if (a === '--tolerance') out.toleranceDeg = Number(argv[++i]);
  }
  return out;
}

function usage(): void {
  console.log(
    [
      'OSM region-boundary importer',
      '',
      'Usage:',
      '  tsx scripts/osm-region-import.ts --slug <regionSlug> [--slug ...] [--apply] [--tolerance 0.0005]',
      '',
      'Modes:',
      '  default: dry-run — fetch Overpass, convert, simplify, validate, write GeoJSON',
      '          to src/regions/fixtures/osm/captured/<slug>.json',
      '  --apply: also upsert each region row (source=OSM) in the dev DB. MANUAL rows',
      '          are protected and skipped per the brief provenance rule.',
      '',
      'Environment:',
      '  Optional. The public Overpass instance is used by default. Set OVERPASS_URL',
      '  to point at a private instance.',
    ].join('\n'),
  );
}

async function maybePersist(
  slug: string,
  geometry: unknown,
  apply: boolean,
): Promise<{ applied: boolean; reason: string }> {
  if (!apply) return { applied: false, reason: 'dry-run' };

  // Lazy-import prisma so the dry-run path stays Node-vanilla. Apply mode
  // requires `node --conditions=react-server --import tsx` (the same trick
  // npm test uses) — otherwise the 'server-only' import in prisma.ts will
  // throw before we get here.
  const { prisma } = await import('../src/lib/prisma');
  const existing = await prisma.region.findUnique({ where: { slug } });
  const decision = shouldApply(
    existing ? (existing.source as 'SEED' | 'OSM' | 'MANUAL') : undefined,
  );
  if (!decision.apply) {
    return { applied: false, reason: decision.reason };
  }
  const { computeBbox, computeCentroid } = await import('../src/regions/geo/coords');
  const centroid = computeCentroid(geometry as never);
  const bbox = computeBbox(geometry as never);
  await prisma.region.update({
    where: { slug },
    data: {
      polygon: JSON.stringify(geometry),
      centroidLat: centroid.lat,
      centroidLng: centroid.lng,
      bbox: JSON.stringify(bbox),
      source: 'OSM',
    },
  });
  return { applied: true, reason: decision.reason };
}

async function main() {
  loadDotEnv();
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    usage();
    return;
  }
  if (args.slugs.length === 0) {
    usage();
    process.exitCode = 1;
    return;
  }

  mkdirSync(CAPTURED_DIR, { recursive: true });

  for (const slug of args.slugs) {
    const seedRegion = SEED_REGIONS.find((r) => r.slug === slug);
    if (!seedRegion) {
      console.error(`✗ ${slug}: not in SEED_REGIONS; nothing to anchor the bbox`);
      continue;
    }
    const destination = SEED_DESTINATIONS.find((d) => d.slug === seedRegion.destinationSlug);
    if (!destination) {
      console.error(`✗ ${slug}: destination ${seedRegion.destinationSlug} not seeded`);
      continue;
    }

    // Use the seed region's own bbox, expanded a bit, as the Overpass
    // bbox. Wider than strictly necessary to catch boundaries whose
    // canonical name differs slightly from our seed name.
    const padLng = (seedRegion.polygon.type === 'Polygon'
      ? seedRegion.polygon.coordinates[0]
      : seedRegion.polygon.coordinates[0][0]
    ).reduce(
      (acc, [lng]) => ({ min: Math.min(acc.min, lng), max: Math.max(acc.max, lng) }),
      { min: Infinity, max: -Infinity },
    );
    const padLat = (seedRegion.polygon.type === 'Polygon'
      ? seedRegion.polygon.coordinates[0]
      : seedRegion.polygon.coordinates[0][0]
    ).reduce(
      (acc, [, lat]) => ({ min: Math.min(acc.min, lat), max: Math.max(acc.max, lat) }),
      { min: Infinity, max: -Infinity },
    );
    const pad = 0.05;
    const overpassBbox = {
      minLng: padLng.min - pad,
      maxLng: padLng.max + pad,
      minLat: padLat.min - pad,
      maxLat: padLat.max + pad,
    };

    const query = buildBoundaryQuery(seedRegion.name, overpassBbox);
    console.log(`→ ${slug} (${seedRegion.name}) querying Overpass…`);

    let raw: unknown;
    try {
      raw = await fetchOverpass(query, { endpoint: process.env.OVERPASS_URL });
    } catch (e) {
      console.error(`✗ ${slug}: Overpass fetch failed — ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }

    const rawPath = resolve(CAPTURED_DIR, `${slug}.overpass.json`);
    writeFileSync(rawPath, JSON.stringify(raw, null, 2));

    const { candidates, notes } = convertOverpass(raw, seedRegion.name, {
      simplifyToleranceDeg: args.toleranceDeg,
    });

    for (const note of notes) console.log(`  · ${note}`);

    if (candidates.length === 0) {
      console.log(`  ⨯ no usable boundary — ${slug} stays hand-drawn`);
      continue;
    }

    // Auto-pick: a single 'exact' match wins. Otherwise log and require
    // operator confirmation — silent wrong-write is the worst outcome.
    const exact = candidates.filter((c) => c.matchKind === 'exact');
    const chosen = exact.length === 1 ? exact[0] : null;
    if (!chosen) {
      console.log(`  ! multiple / non-exact matches — review and re-run with --slug ${slug}:`);
      for (const c of candidates) {
        console.log(`     ${c.matchKind} · ${c.name} (vertices: ${c.vertexCount})`);
      }
      continue;
    }

    const geoPath = resolve(CAPTURED_DIR, `${slug}.geojson`);
    writeFileSync(geoPath, JSON.stringify(chosen.geometry, null, 2));
    console.log(`  ✓ wrote ${geoPath} (${chosen.vertexCount} vertices)`);

    const persisted = await maybePersist(slug, chosen.geometry, args.apply);
    if (persisted.applied) {
      console.log(`  ✓ persisted to DB — source=OSM, reason=${persisted.reason}`);
    } else {
      console.log(`  · DB write skipped — ${persisted.reason}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
