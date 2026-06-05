import 'server-only';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import type { GeoPolygonOrMulti } from '../types';
import { computeBbox, computeCentroid } from '../geo/coords';

const positionSchema = z.tuple([z.number(), z.number()]);
const ringSchema = z.array(positionSchema).min(4);
const polygonSchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(ringSchema).min(1),
});
const multiPolygonSchema = z.object({
  type: z.literal('MultiPolygon'),
  coordinates: z.array(z.array(ringSchema).min(1)).min(1),
});

export const polygonOrMultiSchema = z.union([polygonSchema, multiPolygonSchema]);

function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'region';
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let n = 2;
  while (await prisma.region.findUnique({ where: { slug } })) {
    slug = `${base}-${n++}`;
    if (n > 100) throw new Error('uniqueSlug: gave up after 100 attempts');
  }
  return slug;
}

export type CreateRegionInput = {
  name: string;
  destinationId: string;
  polygon: GeoPolygonOrMulti;
};

export async function createRegion(input: CreateRegionInput) {
  const polygon = polygonOrMultiSchema.parse(input.polygon);
  const centroid = computeCentroid(polygon);
  const [minLng, minLat, maxLng, maxLat] = computeBbox(polygon);
  const slug = await uniqueSlug(slugify(input.name));
  return prisma.region.create({
    data: {
      slug,
      name: input.name,
      destinationId: input.destinationId,
      polygon: JSON.stringify(polygon),
      centroidLat: centroid.lat,
      centroidLng: centroid.lng,
      bbox: JSON.stringify([minLng, minLat, maxLng, maxLat]),
      source: 'MANUAL',
    },
  });
}

export type UpdateRegionInput = {
  name?: string;
  destinationId?: string;
  polygon?: GeoPolygonOrMulti;
};

export async function updateRegion(regionId: string, input: UpdateRegionInput) {
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.destinationId !== undefined) data.destinationId = input.destinationId;
  if (input.polygon !== undefined) {
    const polygon = polygonOrMultiSchema.parse(input.polygon);
    const centroid = computeCentroid(polygon);
    const [minLng, minLat, maxLng, maxLat] = computeBbox(polygon);
    data.polygon = JSON.stringify(polygon);
    data.centroidLat = centroid.lat;
    data.centroidLng = centroid.lng;
    data.bbox = JSON.stringify([minLng, minLat, maxLng, maxLat]);
    // Once an admin edits a polygon the row is no longer SEED. Source
    // promotes to MANUAL so the bootstrap loader never demotes it.
    data.source = 'MANUAL';
  }
  return prisma.region.update({ where: { id: regionId }, data });
}
