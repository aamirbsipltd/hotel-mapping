import 'server-only';
import { prisma } from '@/lib/prisma';
import { bootstrapSeed } from './bootstrap';
import { loadRegions, loadAssignments, type DbRegion, type DbAssignmentView } from './store';
import { getHotelInventorySource } from '../source';
import type { HotelPoint } from '../types';
import type { AssignmentStats } from '../assign/types';

export type WorkbenchCountry = { id: string; code: string; name: string };
export type WorkbenchDestination = {
  id: string;
  slug: string;
  name: string;
  countryId: string;
};

export type WorkbenchState = {
  countries: WorkbenchCountry[];
  destinations: WorkbenchDestination[];
  regions: DbRegion[];
  hotels: HotelPoint[];
  assignments: DbAssignmentView[];
  lastRunStats: AssignmentStats | null;
};

export async function getWorkbenchState(): Promise<WorkbenchState> {
  // Ensure the seed exists before the page tries to show anything. Cheap
  // and idempotent on every load.
  await bootstrapSeed();

  const [countries, destinations, regions, assignments, latestRun] = await Promise.all([
    prisma.country.findMany({ orderBy: { name: 'asc' } }),
    prisma.destination.findMany({ orderBy: { name: 'asc' } }),
    loadRegions(),
    loadAssignments(),
    prisma.assignmentRun.findFirst({ orderBy: { createdAt: 'desc' } }),
  ]);
  const source = getHotelInventorySource();
  const hotels = await source.listHotels();

  return {
    countries: countries.map((c) => ({ id: c.id, code: c.code, name: c.name })),
    destinations: destinations.map((d) => ({
      id: d.id,
      slug: d.slug,
      name: d.name,
      countryId: d.countryId,
    })),
    regions,
    hotels,
    assignments,
    lastRunStats: latestRun ? (JSON.parse(latestRun.stats) as AssignmentStats) : null,
  };
}
