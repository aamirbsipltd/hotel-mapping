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
//
// Self-narration discipline (§A1 of the Phase 1 addendum): this page is
// viewed asynchronously, as a link in a client email, with no one
// narrating. Every panel carries a beat caption, the scorecard at the
// top tells the story in one glance, and the foot carries the honesty
// note. The page is its own presenter.

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
  PLATFORM_LABELS,
  contentBeat,
  locationBeat,
  matchBeat,
  pick,
  scorecardFromView,
  type Locale,
} from './labels';
import RawFeedPanel from './raw-feed-panel';
import MatchPanel from './match-panel';
import LocationPanel from './location-panel';
import ContentPanel from './content-panel';
import Scorecard from './scorecard';
import type { PlatformPageView } from './prepare-page';

const LOCALE_LABEL: Record<Locale, string> = { en: 'EN', de: 'DE' };

type Props = { page: PlatformPageView };

export default function PlatformWalkthrough({ page }: Props) {
  const [locale, setLocale] = useState<Locale>('en');
  const { view, rawList } = page;

  // Engine-derived per-panel beats and scorecard data — same source as
  // every other number on the page.
  const scorecard = scorecardFromView(view);
  const beats = {
    match: matchBeat(view, locale),
    location: locationBeat(view, locale),
    content: contentBeat(view, locale),
  };

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

        {/* §A1 — one-glance scorecard for the skimmer who won't scroll. */}
        <Scorecard data={scorecard} locale={locale} />

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
          <MatchPanel match={view.match} beat={beats.match} locale={locale} />
          <LocationPanel location={view.location} beat={beats.location} locale={locale} />
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
        beat={beats.content}
        locale={locale}
      />

      {/* §A4 — learning loop callout. Done-for-you differentiator
          surfaced in plain language. */}
      <LearningCallout locale={locale} />

      {/* §A5 — honesty note at the foot. */}
      <footer className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground italic leading-snug">
          {pick(PLATFORM_LABELS.honesty, locale)}
        </p>
      </footer>
    </div>
  );
}

function LearningCallout({ locale }: { locale: Locale }) {
  return (
    <aside className="rounded-lg border border-amber-200 bg-amber-50/40 p-4 flex gap-3">
      <Sparkles className="size-5 text-amber-700 shrink-0 mt-0.5" />
      <div className="space-y-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900">
          {pick(PLATFORM_LABELS.learning.title, locale)}
        </p>
        <p className="text-xs text-amber-900/80 leading-snug">
          {pick(PLATFORM_LABELS.learning.body, locale)}
        </p>
      </div>
    </aside>
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
