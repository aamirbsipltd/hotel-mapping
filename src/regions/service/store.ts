// DB read/write helpers shared by the API routes and the assign-all
// orchestrator. Two non-negotiables:
//
//   1. NO delete-all-then-reinsert anywhere. Every assignment write is an
//      upsert keyed on hotelKey. Manual rows survive untouched because the
//      pure engine never returns them (they flow back as `preserved`).
//   2. The rbush index is rebuilt every call. There is no module-level
//      cache. A polygon edit takes effect on the very next read because
//      the next call rebuilds from the DB.
//
// Type detail: Prisma 7 + libsql means polygon and bbox come back as
// JSON-encoded strings. We parse on read; callers consume the materialised
// shape.

import 'server-only';
import { prisma } from '@/lib/prisma';
import type { GeoPolygonOrMulti } from '../types';
import type {
  RegionInput,
  ExistingAssignment,
  AssignmentMethod,
} from '../assign/types';

export type DbRegion = {
  id: string;
  slug: string;
  name: string;
  destinationId: string;
  destinationSlug: string;
  destinationName: string;
  countryCode: string;
  polygon: GeoPolygonOrMulti;
  centroidLat: number;
  centroidLng: number;
  bbox: [number, number, number, number];
  source: 'SEED' | 'OSM' | 'MANUAL';
};

export type DbAssignmentView = {
  hotelKey: string;
  regionId: string | null;
  method: AssignmentMethod;
  isOverride: boolean;
  confidence: number | null;
  candidateRegionIds: string[];
  assignedAt: Date;
};

export async function loadRegions(): Promise<DbRegion[]> {
  const rows = await prisma.region.findMany({
    include: { destination: { include: { country: true } } },
    orderBy: [{ destinationId: 'asc' }, { name: 'asc' }],
  });
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    destinationId: r.destinationId,
    destinationSlug: r.destination.slug,
    destinationName: r.destination.name,
    countryCode: r.destination.country.code,
    polygon: JSON.parse(r.polygon) as GeoPolygonOrMulti,
    centroidLat: r.centroidLat,
    centroidLng: r.centroidLng,
    bbox: JSON.parse(r.bbox) as [number, number, number, number],
    source: r.source as 'SEED' | 'OSM' | 'MANUAL',
  }));
}

export function regionsToInputs(regions: DbRegion[]): RegionInput[] {
  return regions.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    destinationSlug: r.destinationSlug,
    polygon: r.polygon,
  }));
}

export async function loadAssignments(): Promise<DbAssignmentView[]> {
  const rows = await prisma.regionAssignment.findMany({
    orderBy: { assignedAt: 'asc' },
  });
  return rows.map((a) => ({
    hotelKey: a.hotelKey,
    regionId: a.regionId,
    method: a.method as AssignmentMethod,
    isOverride: a.isOverride,
    confidence: a.confidence,
    candidateRegionIds: a.candidateRegionIds ? (JSON.parse(a.candidateRegionIds) as string[]) : [],
    assignedAt: a.assignedAt,
  }));
}

export async function loadPreviousMap(): Promise<Map<string, ExistingAssignment>> {
  const rows = await loadAssignments();
  const map = new Map<string, ExistingAssignment>();
  for (const a of rows) {
    map.set(a.hotelKey, {
      hotelKey: a.hotelKey,
      regionId: a.regionId,
      method: a.method,
      isOverride: a.isOverride,
    });
  }
  return map;
}

export async function manualAssign(
  hotelKey: string,
  regionId: string | null,
): Promise<DbAssignmentView> {
  const row = await prisma.regionAssignment.upsert({
    where: { hotelKey },
    create: {
      hotelKey,
      regionId,
      method: 'MANUAL',
      isOverride: true,
      confidence: regionId ? 1 : null,
      candidateRegionIds: regionId ? JSON.stringify([regionId]) : null,
    },
    update: {
      regionId,
      method: 'MANUAL',
      isOverride: true,
      confidence: regionId ? 1 : null,
      candidateRegionIds: regionId ? JSON.stringify([regionId]) : null,
      assignedAt: new Date(),
    },
  });
  return {
    hotelKey: row.hotelKey,
    regionId: row.regionId,
    method: row.method as AssignmentMethod,
    isOverride: row.isOverride,
    confidence: row.confidence,
    candidateRegionIds: row.candidateRegionIds
      ? (JSON.parse(row.candidateRegionIds) as string[])
      : [],
    assignedAt: row.assignedAt,
  };
}
