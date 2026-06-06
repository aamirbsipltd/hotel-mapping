'use client';

// Before / after hero for the /fastx landing — the bid money-shot.
//
// Left: the raw supplier feed exactly as feriendeals shows it today,
// undifferentiated. Right: the categorised OTA section.
//
// One language toggle drives both panels (FacilitiesSection's own
// toggle is suppressed via showToggle={false}). Server pre-built the
// view, so the only client work is flipping a state variable.

import { useState } from 'react';
import FacilitiesSection, { type FacilitiesView } from './facilities-section';
import { FACILITIES_ICON_MAP } from './icon-map';
import type { Locale } from '../taxonomy';

export type RawListItem = {
  id: string;
  sourceField: string;
  bucket: 'auto' | 'review' | 'payment' | 'nearby' | 'excluded';
  en: string;
  de: string;
};

export type HeroProps = {
  hotelName: string;
  hotelCode: string;
  rawList: RawListItem[];      // every triaged RawItem, undifferentiated
  view: FacilitiesView;         // the OTA "after" panel
  counts: {
    total: number;
    auto: number;
    review: number;
    payment: number;
    nearby: number;
    excluded: number;
  };
};

const LOCALE_LABEL: Record<Locale, string> = { en: 'EN', de: 'DE' };

const PANEL_LABELS: Record<Locale, { raw: string; rawSub: string; classified: string; classifiedSub: string }> = {
  en: {
    raw: 'Raw supplier feed',
    rawSub: 'Everything in one undifferentiated list — the way the supplier hands it to you today.',
    classified: 'Classified',
    classifiedSub: 'Snapped into the OTA-style categories the traveller actually sees.',
  },
  de: {
    raw: 'Roh-Lieferantendaten',
    rawSub: 'Alles in einer einzigen Liste — so wie der Lieferant es heute liefert.',
    classified: 'Klassifiziert',
    classifiedSub: 'In die OTA-Kategorien einsortiert, die der Reisende tatsächlich sieht.',
  },
};

const HEADLINE: Record<Locale, (c: HeroProps['counts']) => string> = {
  en: (c) =>
    `${c.auto} auto-classified · ${c.review} correctly flagged for review · ${c.payment} re-homed → Payment · ${c.nearby} → Nearby · ${c.excluded} dropped · zero misclassified`,
  de: (c) =>
    `${c.auto} automatisch klassifiziert · ${c.review} korrekt zur Prüfung markiert · ${c.payment} → Zahlung · ${c.nearby} → In der Umgebung · ${c.excluded} verworfen · null Fehlklassifikationen`,
};

const RECONCILIATION: Record<Locale, (total: number) => string> = {
  en: (n) => `${n} raw attributes in → ${n} accounted for. Zero items quietly dropped.`,
  de: (n) => `${n} Roh-Attribute hinein → ${n} vollständig zugeordnet. Keine still verworfenen Einträge.`,
};

export default function BeforeAfterHero({
  hotelName,
  hotelCode,
  rawList,
  view,
  counts,
}: HeroProps) {
  const [locale, setLocale] = useState<Locale>('en');
  const panel = PANEL_LABELS[locale];
  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">{hotelName}</p>
          <p className="text-xs font-mono text-muted-foreground">{hotelCode}</p>
        </div>
        <div className="flex items-center gap-1">
          {(['en', 'de'] as Locale[]).map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setLocale(loc)}
              aria-pressed={locale === loc}
              className={
                'rounded-md px-2 py-1 text-xs font-medium border transition-colors ' +
                (locale === loc
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground')
              }
            >
              {LOCALE_LABEL[loc]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title={panel.raw} subtitle={panel.rawSub} accent="muted">
          <RawList items={rawList} locale={locale} />
        </Panel>
        <Panel title={panel.classified} subtitle={panel.classifiedSub} accent="emerald">
          <FacilitiesSection
            view={view}
            iconMap={FACILITIES_ICON_MAP}
            defaultLocale={locale}
            // The hero owns the locale; suppress the section's own toggle
            // so both panels can never disagree on language.
            showToggle={false}
            key={locale}
          />
        </Panel>
      </div>

      <HeadlineCaption locale={locale} counts={counts} />
    </section>
  );
}

function Panel({
  title,
  subtitle,
  accent,
  children,
}: {
  title: string;
  subtitle: string;
  accent: 'muted' | 'emerald';
  children: React.ReactNode;
}) {
  const headerClass =
    accent === 'emerald'
      ? 'border-b border-emerald-100 bg-emerald-50/40'
      : 'border-b border-border bg-muted/30';
  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden flex flex-col">
      <div className={'px-4 py-3 ' + headerClass}>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <p className="text-xs text-muted-foreground leading-snug">{subtitle}</p>
      </div>
      <div className="p-4 flex-1">{children}</div>
    </div>
  );
}

function RawList({ items, locale }: { items: RawListItem[]; locale: Locale }) {
  // Source-field badge so the raw view doesn't read as a curated list:
  // cardTypes carry a "Credit Card Type" badge, POI strings carry "POI".
  // The visual point is that the supplier handed everything over without
  // distinguishing what's actually an amenity from what isn't.
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-baseline gap-2 text-xs text-foreground"
        >
          <SourceBadge sourceField={item.sourceField} locale={locale} />
          <span className="truncate">{item[locale] || <span className="italic text-muted-foreground">(empty)</span>}</span>
        </li>
      ))}
    </ul>
  );
}

const SOURCE_BADGE: Record<string, Record<Locale, string>> = {
  amenity: { en: 'Amenity', de: 'Ausstattung' },
  cardTypes: { en: 'Credit Card Type', de: 'Kreditkartentyp' },
  poi: { en: 'POI', de: 'Sehenswürdigkeit' },
};

function SourceBadge({ sourceField, locale }: { sourceField: string; locale: Locale }) {
  const text = SOURCE_BADGE[sourceField]?.[locale] ?? sourceField;
  return (
    <span className="inline-flex shrink-0 items-center rounded-sm border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground w-32 justify-center">
      {text}
    </span>
  );
}

function HeadlineCaption({
  locale,
  counts,
}: {
  locale: Locale;
  counts: HeroProps['counts'];
}) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 px-4 py-3 space-y-1">
      <p className="text-sm font-semibold text-emerald-900">{HEADLINE[locale](counts)}</p>
      <p className="text-xs text-emerald-900/70">{RECONCILIATION[locale](counts.total)}</p>
    </div>
  );
}
