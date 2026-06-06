'use client';

// OTA-style "after" facilities section — Booking.com aesthetic in the
// existing emerald palette.
//
// Server pre-resolves a bilingual snapshot (see prepareFacilitiesView) so
// this client component does no classification or label re-derivation —
// the toggle is a thin state flip over a pre-built object. Keeps the
// client bundle minimal.
//
// Long-German-label discipline (the FastX coordinate-order analogue):
// "Allgemeine Einrichtungen", "Gesprochene Sprachen", "Sicherheit & Schutz",
// "Akzeptierte Zahlung", and "In der Umgebung" must wrap rather than
// truncate. Category headers use `text-base font-semibold leading-snug`
// without `truncate`; the grid uses `auto-rows-min` and `min-w-0` on each
// card so wrapping never breaks adjacent layout.

import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { Locale } from '../taxonomy';

export type ChipView = {
  id: string;          // raw text + index, opaque key
  en: string;
  de: string;
};

export type CategoryCardView = {
  id: string;
  iconName: string;    // serialised so the server can hand this to the client
  labels: { en: string; de: string };
  chips: ChipView[];
};

export type BucketBlockView = {
  id: '_payment' | '_nearby';
  iconName: string;
  labels: { en: string; de: string };
  chips: ChipView[];
};

export type FacilitiesView = {
  categories: CategoryCardView[]; // already filtered to non-empty
  payment: BucketBlockView | null;
  nearby: BucketBlockView | null;
};

type Props = {
  view: FacilitiesView;
  iconMap: Record<string, LucideIcon>;
  defaultLocale?: Locale;
  showToggle?: boolean;
};

const LOCALE_LABEL: Record<Locale, string> = { en: 'EN', de: 'DE' };

export default function FacilitiesSection({
  view,
  iconMap,
  defaultLocale = 'en',
  showToggle = true,
}: Props) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  return (
    <section className="space-y-4">
      {showToggle && (
        <div className="flex items-center justify-end gap-1">
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
      )}

      {view.categories.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No amenities classified.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-min">
          {view.categories.map((card) => (
            <CategoryCard key={card.id} card={card} iconMap={iconMap} locale={locale} />
          ))}
        </div>
      )}

      {(view.payment || view.nearby) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
          {view.payment && (
            <BucketBlock
              block={view.payment}
              iconMap={iconMap}
              locale={locale}
              accentClass="border-sky-200 bg-sky-50/40"
              accentTextClass="text-sky-900"
              chipClass="bg-sky-100 text-sky-900 border-sky-200"
            />
          )}
          {view.nearby && (
            <BucketBlock
              block={view.nearby}
              iconMap={iconMap}
              locale={locale}
              accentClass="border-teal-200 bg-teal-50/40"
              accentTextClass="text-teal-900"
              chipClass="bg-teal-100 text-teal-900 border-teal-200"
            />
          )}
        </div>
      )}
    </section>
  );
}

function CategoryCard({
  card,
  iconMap,
  locale,
}: {
  card: CategoryCardView;
  iconMap: Record<string, LucideIcon>;
  locale: Locale;
}) {
  const Icon = iconMap[card.iconName];
  return (
    <article className="min-w-0 rounded-lg border border-border bg-background p-3 space-y-2">
      <header className="flex items-start gap-2">
        {Icon ? (
          <span className="grid place-items-center size-7 rounded-md bg-emerald-50 text-emerald-700 shrink-0">
            <Icon className="size-4" />
          </span>
        ) : null}
        <h3 className="text-sm font-semibold leading-snug text-foreground">
          {card.labels[locale]}
        </h3>
      </header>
      <ul className="flex flex-wrap gap-1.5">
        {card.chips.map((chip) => (
          <li
            key={chip.id}
            className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50/60 px-2 py-0.5 text-xs text-emerald-900"
          >
            <span>{chip[locale]}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function BucketBlock({
  block,
  iconMap,
  locale,
  accentClass,
  accentTextClass,
  chipClass,
}: {
  block: BucketBlockView;
  iconMap: Record<string, LucideIcon>;
  locale: Locale;
  accentClass: string;
  accentTextClass: string;
  chipClass: string;
}) {
  const Icon = iconMap[block.iconName];
  return (
    <div className={'min-w-0 rounded-lg border p-3 space-y-2 ' + accentClass}>
      <header className="flex items-start gap-2">
        {Icon ? (
          <span className={'grid place-items-center size-7 rounded-md bg-background shrink-0 ' + accentTextClass}>
            <Icon className="size-4" />
          </span>
        ) : null}
        <h3 className={'text-sm font-semibold leading-snug ' + accentTextClass}>
          {block.labels[locale]}
        </h3>
      </header>
      <ul className="flex flex-wrap gap-1.5">
        {block.chips.map((chip) => (
          <li
            key={chip.id}
            className={'inline-flex items-center rounded-full border px-2 py-0.5 text-xs ' + chipClass}
          >
            <span>{chip[locale]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
