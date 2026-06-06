'use client';

// Platform walkthrough — page-level client shell.
//
// Owns the one EN/DE toggle for the whole page. Every panel receives the
// current locale as a prop; embedded FacilitiesSection has its own
// toggle suppressed (Content panel sets showToggle={false}). The panels
// cannot disagree on language by construction.
//
// Pure render of the prepared page view — no fetch, no recompute, no
// state beyond `locale`.

import { useState } from 'react';
import { PLATFORM_LABELS, pick, type Locale } from './labels';
import RawFeedPanel from './raw-feed-panel';
import MatchPanel from './match-panel';
import LocationPanel from './location-panel';
import ContentPanel from './content-panel';
import type { PlatformPageView } from './prepare-page';

const LOCALE_LABEL: Record<Locale, string> = { en: 'EN', de: 'DE' };

type Props = { page: PlatformPageView };

export default function PlatformWalkthrough({ page }: Props) {
  const [locale, setLocale] = useState<Locale>('en');
  const { view, rawList } = page;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-2 max-w-3xl">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              {pick(PLATFORM_LABELS.headline, locale)}
            </h1>
            <p className="text-base text-muted-foreground leading-snug">
              {pick(PLATFORM_LABELS.subcopy, locale)}
            </p>
          </div>
          <LocaleToggle locale={locale} setLocale={setLocale} />
        </div>
        <p className="text-xs text-muted-foreground italic">
          {pick(PLATFORM_LABELS.poweredBy, locale)}
        </p>

        <div className="rounded-md border border-border bg-muted/30 px-4 py-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-sm font-medium text-foreground">{view.hotel.name}</span>
          <span className="text-xs font-mono text-muted-foreground">{view.hotel.key}</span>
          <span className="text-xs text-muted-foreground">
            {view.hotel.coords.lat.toFixed(4)}, {view.hotel.coords.lng.toFixed(4)}
          </span>
        </div>
      </header>

      {/* Body — split: Raw left, three Result panels right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RawFeedPanel
          hotelName={view.hotel.name}
          destinationLabel={view.hotel.city}
          rawList={rawList}
          locale={locale}
        />
        <div className="space-y-4">
          <MatchPanel match={view.match} locale={locale} />
          <LocationPanel location={view.location} locale={locale} />
        </div>
      </div>

      {/* Content panel — full width below */}
      <ContentPanel
        view={view.content.view}
        counts={{
          total: view.content.stats.total,
          auto: view.content.stats.auto,
          review: view.content.stats.review,
          payment: view.content.stats.payment,
          nearby: view.content.stats.nearby,
          excluded: view.content.stats.excluded,
        }}
        locale={locale}
      />
    </div>
  );
}

function LocaleToggle({
  locale,
  setLocale,
}: {
  locale: Locale;
  setLocale: (l: Locale) => void;
}) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      {(['en', 'de'] as Locale[]).map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => setLocale(loc)}
          aria-pressed={locale === loc}
          className={
            'rounded-md px-2.5 py-1 text-xs font-medium border transition-colors ' +
            (locale === loc
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
              : 'border-border bg-background text-muted-foreground hover:text-foreground')
          }
        >
          {LOCALE_LABEL[loc]}
        </button>
      ))}
    </div>
  );
}
