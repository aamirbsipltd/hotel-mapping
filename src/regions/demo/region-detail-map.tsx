'use client';

// Thin client wrapper around the workbench's RegionMap, configured for
// read-only single-region detail views. Same coordinate discipline, same
// OSM attribution, no draw control. Lives in `regions/demo/` because it's
// public-facing — the workbench surface is the operator one.

import dynamic from 'next/dynamic';
import type { DbRegion } from '../service/store';
import type { HotelPoint } from '../types';

const RegionMap = dynamic(() => import('../admin/region-map'), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full rounded-lg border border-border bg-muted/30 grid place-items-center text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

export type RegionDetailMapProps = {
  regions: DbRegion[];
  hotels: HotelPoint[];
  assignments: {
    hotelKey: string;
    regionId: string | null;
    method: 'AUTO' | 'MANUAL' | 'UNASSIGNED';
    isOverride: boolean;
  }[];
  destinationSlugs: string[];
};

export function RegionDetailMap(props: RegionDetailMapProps) {
  return (
    <RegionMap
      regions={props.regions}
      hotels={props.hotels}
      assignments={props.assignments}
      destinationSlugs={props.destinationSlugs}
    />
  );
}
