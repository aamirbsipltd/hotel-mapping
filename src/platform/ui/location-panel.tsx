'use client';

// Location panel — "searchable by the resort area, not just Dubai."
//
// Static Country › Destination › Region breadcrumb + method/confidence
// badge. **No Leaflet map.** A full map mount for one pin is more weight
// than it earns and would drag a third client-only / ssr:false / OSM-
// attribution surface into the page for little gain.

import { ChevronRight, MapPin, CheckCircle2 } from 'lucide-react';
import { PLATFORM_LABELS, pick, type Locale } from './labels';
import type { PlatformLocation } from '../orchestrate';

type Props = {
  location: PlatformLocation;
  locale: Locale;
};

export default function LocationPanel({ location, locale }: Props) {
  const L = PLATFORM_LABELS.locationField;
  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden">
      <header className="px-4 py-3 border-b border-emerald-100 bg-emerald-50/40 flex items-baseline justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {pick(PLATFORM_LABELS.panel.location, locale)}
        </p>
        <MethodBadge method={location.method} />
      </header>

      <div className="p-4 space-y-3">
        <nav
          aria-label="location breadcrumb"
          className="flex flex-wrap items-center gap-1 text-sm"
        >
          <Crumb label={pick(L.country, locale)} value={location.country} />
          <ChevronRight className="size-3.5 text-muted-foreground" />
          <Crumb label={pick(L.destination, locale)} value={location.destination} />
          <ChevronRight className="size-3.5 text-muted-foreground" />
          <Crumb
            label={pick(L.region, locale)}
            value={location.region ?? '—'}
            highlight
          />
        </nav>

        <div className="grid grid-cols-2 gap-2">
          <Stat
            label={pick(L.method, locale)}
            value={location.method}
            mono
          />
          <Stat
            label={pick(L.confidence, locale)}
            value={(location.confidence * 100).toFixed(0) + '%'}
            accent="emerald"
          />
        </div>

        <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50/40 px-3 py-2">
          <MapPin className="size-4 text-emerald-700 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-900 leading-snug">
            {pick(L.searchable, locale)}
          </p>
        </div>
      </div>
    </div>
  );
}

function Crumb({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <span className="inline-flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span
        className={
          'font-medium ' +
          (highlight ? 'text-emerald-700' : 'text-foreground')
        }
      >
        {value}
      </span>
    </span>
  );
}

function MethodBadge({ method }: { method: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900">
      <CheckCircle2 className="size-3" />
      {method}
    </span>
  );
}

function Stat({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: 'emerald';
}) {
  const valueClass = [
    accent === 'emerald' ? 'text-emerald-700' : 'text-foreground',
    mono ? 'font-mono' : '',
  ].join(' ');
  return (
    <div className="rounded-md border border-border bg-background px-2 py-1.5 min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
        {label}
      </p>
      <p className={'text-lg font-bold tabular-nums leading-tight ' + valueClass}>
        {value}
      </p>
    </div>
  );
}
