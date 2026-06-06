import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SEED_COUNTRIES } from '@/regions/seed/countries';
import { SEED_DESTINATIONS } from '@/regions/seed/destinations';
import { SEED_REGIONS } from '@/regions/seed/regions';
import { getDemoResult } from '@/regions/demo/compute';
import { BeforeAfterHero } from '@/regions/demo/before-after-hero';

export const metadata = {
  title: 'Region Mapping — Hotel Mapping Tool',
  description:
    'Assign hotels to curated regions by point-in-polygon. Admin map for drawing and refining polygons. Region-based search by Dubai Marina, JBR, Palm Jumeirah, not just "Dubai".',
};

type DestinationView = {
  slug: string;
  name: string;
  regionCount: number;
  hotelCount: number;
};

type CountryView = {
  code: string;
  name: string;
  destinations: DestinationView[];
};

function buildView(hotelsByDestination: Map<string, number>): CountryView[] {
  const regionCountBy = new Map<string, number>();
  for (const r of SEED_REGIONS) {
    regionCountBy.set(r.destinationSlug, (regionCountBy.get(r.destinationSlug) ?? 0) + 1);
  }
  const destByCountry = new Map<string, DestinationView[]>();
  for (const d of SEED_DESTINATIONS) {
    const list = destByCountry.get(d.countryCode) ?? [];
    list.push({
      slug: d.slug,
      name: d.name,
      regionCount: regionCountBy.get(d.slug) ?? 0,
      hotelCount: hotelsByDestination.get(d.slug) ?? 0,
    });
    destByCountry.set(d.countryCode, list);
  }
  return SEED_COUNTRIES.map((c) => ({
    code: c.code,
    name: c.name,
    destinations: destByCountry.get(c.code) ?? [],
  }));
}

export default function RegionsPage() {
  const { hotels, result } = getDemoResult();
  const hotelsByDestination = new Map<string, number>();
  for (const h of hotels) {
    if (!h.currentDestinationSlug) continue;
    hotelsByDestination.set(
      h.currentDestinationSlug,
      (hotelsByDestination.get(h.currentDestinationSlug) ?? 0) + 1,
    );
  }
  const view = buildView(hotelsByDestination);
  const totalRegions = SEED_REGIONS.length;
  const totalDestinations = SEED_DESTINATIONS.length;
  const totalCountries = SEED_COUNTRIES.length;

  return (
    <div className="flex flex-col">
      <section className="mx-auto max-w-5xl px-4 pt-20 pb-12 text-center space-y-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700">
          <MapPin className="h-3 w-3" /> Region mapping
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
          Snap a flat hotel list<br className="hidden sm:block" />
          into the regions you actually sell
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Curated region polygons you own. Point-in-polygon assignment.
          Overlap and offshore hotels route to a review queue. Search by
          Dubai Marina, JBR, Palm Jumeirah — not just &ldquo;Dubai.&rdquo;
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <BeforeAfterHero destinationSlug="dubai" />
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-6 space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="Countries seeded" value={totalCountries} />
          <Stat label="Destinations" value={totalDestinations} />
          <Stat label="Regions" value={totalRegions} />
        </div>
        <div className="flex justify-center">
          <Link
            href="/regions/admin"
            className={cn(buttonVariants({ size: 'lg' }), 'gap-2')}
          >
            Open region admin <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20 space-y-8">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Browse</h2>
          <p className="text-sm text-muted-foreground">
            Country → Destination → Region. Drill into a region to see the
            hotels it contains.
          </p>
        </div>

        {view.map((country) => (
          <div key={country.code} className="space-y-3">
            <div className="flex items-baseline gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {country.name}
              </h3>
              <span className="text-xs font-mono text-muted-foreground">
                {country.code}
              </span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {country.destinations.map((d) => (
                <li
                  key={d.slug}
                  className="rounded-lg border border-border bg-background p-5 flex flex-col gap-3"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{d.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.regionCount} region{d.regionCount === 1 ? '' : 's'} · {d.hotelCount} hotel{d.hotelCount === 1 ? '' : 's'} on file
                    </p>
                  </div>
                  <div className="mt-auto">
                    <Link
                      href={`/regions/${encodeURIComponent(d.slug)}`}
                      className={cn(
                        buttonVariants({ variant: 'outline', size: 'sm' }),
                        'gap-1.5',
                      )}
                    >
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <p className="text-xs text-muted-foreground">
          Engine output: {result.stats.auto} auto-assigned · {result.stats.review} review · {result.stats.unassigned} unassigned · {(result.stats.autoRate * 100).toFixed(1)}% auto-rate. Seed polygons are approximate hand-authored starting points; the admin map refines them.
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-3">
      <p className="text-2xl font-extrabold tabular-nums text-foreground">
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
