// Idempotent DB seeding. Upserts every SEED_COUNTRIES → SEED_DESTINATIONS →
// SEED_REGIONS row so re-loading the admin page (or starting against a
// fresh DB) never leaves the workbench empty. Existing rows are left as-is
// — the admin's MANUAL polygons survive seed re-runs because we only
// touch rows whose slug matches a seed entry.

import 'server-only';
import { prisma } from '@/lib/prisma';
import { SEED_COUNTRIES } from '../seed/countries';
import { SEED_DESTINATIONS } from '../seed/destinations';
import { SEED_REGIONS } from '../seed/regions';
import { computeBbox, computeCentroid } from '../geo/coords';

export async function bootstrapSeed(): Promise<void> {
  for (const c of SEED_COUNTRIES) {
    await prisma.country.upsert({
      where: { code: c.code },
      create: { code: c.code, name: c.name },
      update: { name: c.name },
    });
  }

  for (const d of SEED_DESTINATIONS) {
    const country = await prisma.country.findUnique({ where: { code: d.countryCode } });
    if (!country) continue;
    await prisma.destination.upsert({
      where: { slug: d.slug },
      create: { slug: d.slug, name: d.name, countryId: country.id },
      update: { name: d.name, countryId: country.id },
    });
  }

  for (const r of SEED_REGIONS) {
    const destination = await prisma.destination.findUnique({
      where: { slug: r.destinationSlug },
    });
    if (!destination) continue;
    const centroid = computeCentroid(r.polygon);
    const bbox = computeBbox(r.polygon);
    await prisma.region.upsert({
      where: { slug: r.slug },
      create: {
        slug: r.slug,
        name: r.name,
        destinationId: destination.id,
        polygon: JSON.stringify(r.polygon),
        centroidLat: centroid.lat,
        centroidLng: centroid.lng,
        bbox: JSON.stringify(bbox),
        source: r.source,
      },
      update: {
        name: r.name,
        destinationId: destination.id,
        polygon: JSON.stringify(r.polygon),
        centroidLat: centroid.lat,
        centroidLng: centroid.lng,
        bbox: JSON.stringify(bbox),
        // source is intentionally NOT updated on existing rows — once an
        // admin marks a region MANUAL by editing it, the seed shouldn't
        // demote it back to SEED.
      },
    });
  }
}
