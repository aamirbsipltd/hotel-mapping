import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getWorkbenchState } from '@/regions/service/workbench-state';
import RegionWorkbench from '@/regions/admin/workbench';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Region Admin · Hotel Mapping Tool',
  description:
    'Draw and edit region polygons. Override hotel-to-region assignments. Re-run the batch and watch overrides survive.',
};

export default async function RegionAdminPage() {
  const initialState = await getWorkbenchState();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <div className="space-y-2">
        <Link
          href="/regions"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Region overview
        </Link>
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground">Region admin</h1>
          <p className="text-xs text-muted-foreground">
            {initialState.regions.length} regions · {initialState.hotels.length} hotels · {initialState.assignments.length} assignments on file
          </p>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Draw a polygon to seed a new region, click a hotel to override its
          assignment, hit re-run to apply. Manual overrides survive each
          re-run. The map uses OpenStreetMap tiles — attribution stays
          visible per OSM tile policy.
        </p>
      </div>

      <RegionWorkbench initialState={initialState} />
    </div>
  );
}
