'use client';

// Content panel — the FastX OTA section with the page-level toggle in
// charge of language. The embedded FacilitiesSection's own toggle is
// suppressed (showToggle={false}) so the page-level toggle is the only
// way to flip language, and the panels can never disagree.
//
// Reconciliation banner below — counts come straight from
// view.content.stats (engine-derived; never hardcoded).

import FacilitiesSection, { type FacilitiesView } from '../../fastx/ota/facilities-section';
import { FACILITIES_ICON_MAP } from '../../fastx/ota/icon-map';
import { PLATFORM_LABELS, pick, behaviourHeadline, reconciliationLine, type Locale, type ContentCounts } from './labels';

type Props = {
  view: FacilitiesView;
  counts: ContentCounts;
  beat: string;
  locale: Locale;
};

export default function ContentPanel({ view, counts, beat, locale }: Props) {
  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden">
      <header className="px-4 py-3 border-b border-emerald-100 bg-emerald-50/40 space-y-2">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {pick(PLATFORM_LABELS.panel.content, locale)}
          </p>
          <p className="text-xs text-emerald-900/80 leading-snug">{beat}</p>
        </div>
        {/* §A3 — lead with the business outcome; the mechanics live in
            the reconciliation banner at the foot. */}
        <p className="text-sm font-semibold text-emerald-900 leading-snug">
          {pick(PLATFORM_LABELS.contentBanner.outcomeLead, locale)}
        </p>
      </header>

      <div className="p-4">
        <FacilitiesSection
          view={view}
          iconMap={FACILITIES_ICON_MAP}
          defaultLocale={locale}
          // The page-level toggle is in charge; suppress the section's
          // own toggle so the two cannot disagree on language. The
          // `key={locale}` remount swaps language deterministically.
          showToggle={false}
          key={locale}
        />
      </div>

      <ReconciliationBanner counts={counts} locale={locale} />
    </div>
  );
}

function ReconciliationBanner({
  counts,
  locale,
}: {
  counts: ContentCounts;
  locale: Locale;
}) {
  return (
    <div className="border-t border-emerald-200 bg-emerald-50/40 px-4 py-3 space-y-1">
      <p className="text-sm font-semibold text-emerald-900">{behaviourHeadline(counts, locale)}</p>
      <p className="text-xs text-emerald-900/70">{reconciliationLine(counts.total, locale)}</p>
    </div>
  );
}
