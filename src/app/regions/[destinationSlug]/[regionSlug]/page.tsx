import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { SEED_COUNTRIES } from '@/regions/seed/countries';
import { SEED_DESTINATIONS } from '@/regions/seed/destinations';
import { getDemoResult } from '@/regions/demo/compute';
import { MARKER_COLORS, STATE_LABELS, type MarkerState } from '@/regions/admin/colors';
import { RegionDetailMap } from '@/regions/demo/region-detail-map';
import type { DbRegion } from '@/regions/service/store';
import type { IndexedRegion } from '@/regions/assign/types';

type Params = Promise<{ destinationSlug: string; regionSlug: string }>;

function toDbRegionShape(
  r: IndexedRegion,
  destinationName: string,
  destinationId: string,
  countryCode: string,
): DbRegion {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    destinationId,
    destinationSlug: r.destinationSlug,
    destinationName,
    countryCode,
    polygon: r.polygon,
    centroidLat: r.centroidLat,
    centroidLng: r.centroidLng,
    bbox: [r.minLng, r.minLat, r.maxLng, r.maxLat],
    source: 'SEED',
  };
}

export default async function RegionDetailPage({ params }: { params: Params }) {
  const { destinationSlug, regionSlug } = await params;
  const dSlug = decodeURIComponent(destinationSlug);
  const rSlug = decodeURIComponent(regionSlug);

  const destination = SEED_DESTINATIONS.find((d) => d.slug === dSlug);
  if (!destination) notFound();
  const country = SEED_COUNTRIES.find((c) => c.code === destination.countryCode);
  if (!country) notFound();

  const { regions, hotels, result } = getDemoResult();
  const region = regions.find(
    (r) => r.slug === rSlug && r.destinationSlug === destination.slug,
  );
  if (!region) notFound();

  // Hotels assigned to this region (engine output — manual overrides not
  // applicable on the public surface).
  const assignmentByKey = new Map(result.assignments.map((a) => [a.hotelKey, a]));
  const assignedHotels = hotels.filter((h) => {
    const a = assignmentByKey.get(h.hotelKey);
    return a?.regionId === region.id;
  });

  // Candidate hotels — those whose engine output suggests this region in
  // review (REVIEW_MULTI smallest-area pick or REVIEW_FALLBACK nearest).
  const suggestedHotels = hotels.filter((h) => {
    const a = assignmentByKey.get(h.hotelKey);
    return (
      a &&
      a.regionId !== region.id &&
      a.suggestedRegionId === region.id
    );
  });

  // Pull the destination's regions for the mini-map so the neighbouring
  // polygons render too (helpful context, especially in the Marina ↔ JBR
  // case where the user wants to see the overlap).
  const destRegions = regions.filter((r) => r.destinationSlug === destination.slug);
  const destHotels = hotels.filter((h) => h.currentDestinationSlug === destination.slug);
  const allDestinationSlugs = Array.from(
    new Set(regions.map((r) => r.destinationSlug)),
  );

  const mapRegions = destRegions.map((r) =>
    toDbRegionShape(r, destination.name, destination.slug, country.code),
  );
  const mapAssignments = destHotels.map((h) => {
    const a = assignmentByKey.get(h.hotelKey);
    return {
      hotelKey: h.hotelKey,
      regionId: a?.regionId ?? null,
      method: a?.method ?? ('UNASSIGNED' as const),
      isOverride: false,
    };
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 space-y-10">
      <div className="space-y-2">
        <Link
          href={`/regions/${encodeURIComponent(destination.slug)}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {destination.name}
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{region.name}</h1>
        <p className="text-xs text-muted-foreground">
          {country.name} · {destination.name} · {assignedHotels.length} assigned hotel{assignedHotels.length === 1 ? '' : 's'}
          {suggestedHotels.length ? ` · ${suggestedHotels.length} review suggestion${suggestedHotels.length === 1 ? '' : 's'}` : ''}
        </p>
      </div>

      <RegionDetailMap
        regions={mapRegions}
        hotels={destHotels}
        assignments={mapAssignments}
        destinationSlugs={allDestinationSlugs}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Assigned hotels
        </h2>
        {assignedHotels.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hotels assigned to this region yet.
          </p>
        ) : (
          <ul className="rounded-lg border border-border bg-background divide-y divide-border">
            {assignedHotels.map((h) => (
              <HotelRow key={h.hotelKey} hotelKey={h.hotelKey} name={h.name} lat={h.lat} lng={h.lng} state="auto" />
            ))}
          </ul>
        )}
      </section>

      {suggestedHotels.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Review suggestions for this region
          </h2>
          <p className="text-xs text-muted-foreground">
            Engine flagged these for human review and suggested this region. Operator approves or reassigns in the admin map.
          </p>
          <ul className="rounded-lg border border-border bg-background divide-y divide-border">
            {suggestedHotels.map((h) => (
              <HotelRow key={h.hotelKey} hotelKey={h.hotelKey} name={h.name} lat={h.lat} lng={h.lng} state="review" />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function HotelRow({
  hotelKey,
  name,
  lat,
  lng,
  state,
}: {
  hotelKey: string;
  name: string;
  lat: number;
  lng: number;
  state: MarkerState;
}) {
  return (
    <li className="px-4 py-2.5 flex items-baseline gap-3 text-sm">
      <span
        className="inline-block size-2 rounded-full shrink-0"
        style={{ background: MARKER_COLORS[state] }}
      />
      <span className="font-mono text-xs text-muted-foreground w-44 shrink-0">{hotelKey}</span>
      <span className="font-medium text-foreground truncate">{name}</span>
      <span className="ml-auto text-xs text-muted-foreground">
        {state === 'review' ? STATE_LABELS.review : `${lat.toFixed(4)}, ${lng.toFixed(4)}`}
      </span>
    </li>
  );
}
