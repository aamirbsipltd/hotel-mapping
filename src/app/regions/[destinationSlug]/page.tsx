import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SEED_COUNTRIES } from '@/regions/seed/countries';
import { SEED_DESTINATIONS } from '@/regions/seed/destinations';
import { getDemoResult } from '@/regions/demo/compute';
import { MARKER_COLORS, STATE_LABELS, markerState, type MarkerState } from '@/regions/admin/colors';

type Params = Promise<{ destinationSlug: string }>;

export default async function DestinationPage({ params }: { params: Params }) {
  const { destinationSlug } = await params;
  const slug = decodeURIComponent(destinationSlug);

  const destination = SEED_DESTINATIONS.find((d) => d.slug === slug);
  if (!destination) notFound();

  const country = SEED_COUNTRIES.find((c) => c.code === destination.countryCode);

  const { regions, hotels, result } = getDemoResult();
  const destRegions = regions.filter((r) => r.destinationSlug === destination.slug);
  const destHotels = hotels.filter((h) => h.currentDestinationSlug === destination.slug);
  const assignmentByKey = new Map(result.assignments.map((a) => [a.hotelKey, a]));

  // Aggregate per-region hotel counts + per-state tallies for the dest.
  const countsByRegion = new Map<string, number>();
  const stateTally: Record<MarkerState, number> = {
    auto: 0,
    manual: 0,
    review: 0,
    unassigned: 0,
  };
  for (const h of destHotels) {
    const a = assignmentByKey.get(h.hotelKey);
    if (a?.regionId) {
      countsByRegion.set(a.regionId, (countsByRegion.get(a.regionId) ?? 0) + 1);
    }
    const s = markerState({
      method: a?.method,
      regionId: a?.regionId,
      route: a?.route,
    });
    stateTally[s]++;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 space-y-10">
      <div className="space-y-2">
        <Link
          href="/regions"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All destinations
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{destination.name}</h1>
        <p className="text-xs text-muted-foreground">
          {country?.name ?? destination.countryCode} · {destRegions.length} region{destRegions.length === 1 ? '' : 's'} · {destHotels.length} hotel{destHotels.length === 1 ? '' : 's'}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Engine breakdown
        </h2>
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(['auto', 'manual', 'review', 'unassigned'] as MarkerState[]).map((s) => (
            <li key={s} className="rounded-md border border-border px-3 py-2">
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ background: MARKER_COLORS[s] }}
                />
                <span className="text-xs text-muted-foreground">{STATE_LABELS[s]}</span>
              </div>
              <p className="text-lg font-bold tabular-nums text-foreground">
                {stateTally[s]}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Regions
          </h2>
          <p className="text-xs text-muted-foreground">
            Click a region to filter the hotel list.
          </p>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {destRegions.map((r) => {
            const count = countsByRegion.get(r.id) ?? 0;
            return (
              <li
                key={r.slug}
                className="rounded-lg border border-border bg-background p-4 flex flex-col gap-2"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-medium text-foreground">{r.name}</p>
                  <span className="text-xs text-muted-foreground">
                    {count} hotel{count === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="text-xs font-mono text-muted-foreground">
                  centroid {r.centroidLat.toFixed(4)}, {r.centroidLng.toFixed(4)}
                </p>
                <div className="mt-auto pt-1">
                  <Link
                    href={`/regions/${encodeURIComponent(destination.slug)}/${encodeURIComponent(r.slug)}`}
                    className={cn(
                      buttonVariants({ variant: 'outline', size: 'sm' }),
                      'gap-1.5',
                    )}
                  >
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          All hotels in this destination
        </h2>
        <ul className="rounded-lg border border-border bg-background divide-y divide-border">
          {destHotels.map((h) => {
            const a = assignmentByKey.get(h.hotelKey);
            const s = markerState({
              method: a?.method,
              regionId: a?.regionId,
              route: a?.route,
            });
            const region = a?.regionId
              ? destRegions.find((r) => r.id === a.regionId)
              : null;
            return (
              <li
                key={h.hotelKey}
                className="px-4 py-2.5 flex items-baseline gap-3 text-sm"
              >
                <span
                  className="inline-block size-2 rounded-full shrink-0"
                  style={{ background: MARKER_COLORS[s] }}
                />
                <span className="font-mono text-xs text-muted-foreground w-44 shrink-0">
                  {h.hotelKey}
                </span>
                <span className="font-medium text-foreground truncate">{h.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {region ? region.name : STATE_LABELS[s]}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
