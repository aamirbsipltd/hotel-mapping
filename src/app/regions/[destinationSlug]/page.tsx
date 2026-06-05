import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SEED_COUNTRIES } from '@/regions/seed/countries';
import { SEED_DESTINATIONS } from '@/regions/seed/destinations';
import { SEED_REGIONS } from '@/regions/seed/regions';
import { FIXTURE_HOTELS } from '@/regions/fixtures/hotels';
import { computeBbox, computeCentroid } from '@/regions/geo/coords';

// Phase 0 stub. Shows the seed regions for a destination + the fixture
// hotels currently claimed in that destination, with precomputed centroid
// and bbox so the rbush index the Phase 1 engine builds can be sanity-
// checked by eye. Phase 2 replaces this with the Leaflet admin workbench.

type Params = Promise<{ destinationSlug: string }>;

export default async function DestinationPage({ params }: { params: Params }) {
  const { destinationSlug } = await params;
  const slug = decodeURIComponent(destinationSlug);

  const destination = SEED_DESTINATIONS.find((d) => d.slug === slug);
  if (!destination) notFound();

  const country = SEED_COUNTRIES.find((c) => c.code === destination.countryCode);
  const regions = SEED_REGIONS.filter((r) => r.destinationSlug === destination.slug);
  const claimed = FIXTURE_HOTELS.filter((h) => h.currentDestinationSlug === destination.slug);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 space-y-8">
      <div className="space-y-2">
        <Link
          href="/regions"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All destinations
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{destination.name}</h1>
        <p className="text-xs text-muted-foreground">
          {country?.name ?? destination.countryCode} · {regions.length} seed region{regions.length === 1 ? '' : 's'} · {claimed.length} claimed hotel{claimed.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Seed regions
        </h2>
        <ul className="space-y-2">
          {regions.map((r) => {
            const c = computeCentroid(r.polygon);
            const [minLng, minLat, maxLng, maxLat] = computeBbox(r.polygon);
            return (
              <li key={r.slug} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-baseline gap-2">
                  <p className="font-medium text-foreground">{r.name}</p>
                  <span className="text-xs font-mono text-muted-foreground">{r.slug}</span>
                  <span className="ml-auto text-xs uppercase tracking-wider text-muted-foreground">
                    {r.source}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  centroid {c.lat.toFixed(4)}, {c.lng.toFixed(4)} · bbox [{minLng.toFixed(3)}, {minLat.toFixed(3)}, {maxLng.toFixed(3)}, {maxLat.toFixed(3)}]
                </p>
                {r.note && (
                  <p className="text-xs text-muted-foreground mt-1 italic">{r.note}</p>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Claimed hotels
        </h2>
        <ul className="rounded-lg border border-border bg-background divide-y divide-border">
          {claimed.map((h) => (
            <li key={h.hotelKey} className="px-4 py-2.5 flex items-baseline gap-3 text-sm">
              <span className="font-mono text-xs text-muted-foreground w-44 shrink-0">{h.hotelKey}</span>
              <span className="font-medium text-foreground">{h.name}</span>
              <span className="ml-auto text-xs font-mono text-muted-foreground">
                {h.lat.toFixed(4)}, {h.lng.toFixed(4)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-3">
        <Link href="/regions" className={cn(buttonVariants({ variant: 'outline' }))}>
          Back
        </Link>
      </div>
    </div>
  );
}
