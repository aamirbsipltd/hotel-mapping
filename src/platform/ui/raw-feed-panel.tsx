'use client';

// Raw supplier feed — the "before."
//
// Three sub-sections show the three messes the platform solves: identity
// (unmatched, no rating/reviews), location (bare destination label), and
// content (the 28 attributes jumbled, lifted from the FastX hero
// treatment).

import { AlertCircle, MapPin, Database } from 'lucide-react';
import { PLATFORM_LABELS, pick, type Locale } from './labels';
import type { RawListItem } from '../../fastx/ota/before-after-hero';

type Props = {
  hotelName: string;
  destinationLabel: string; // the supplier's bare "Dubai"
  rawList: RawListItem[];
  locale: Locale;
};

const SOURCE_BADGE: Record<string, Record<Locale, string>> = {
  amenity: { en: 'Amenity', de: 'Ausstattung' },
  cardTypes: { en: 'Credit Card Type', de: 'Kreditkartentyp' },
  poi: { en: 'POI', de: 'Sehenswürdigkeit' },
};

export default function RawFeedPanel({
  hotelName,
  destinationLabel,
  rawList,
  locale,
}: Props) {
  const L = PLATFORM_LABELS.rawSection;
  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-border bg-muted/30 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {pick(PLATFORM_LABELS.panel.raw, locale)}
        </p>
        <p className="text-xs text-muted-foreground leading-snug">
          {pick(PLATFORM_LABELS.rawSubtitle, locale)}
        </p>
        <p className="text-xs text-muted-foreground/80 italic leading-snug">
          {pick(PLATFORM_LABELS.beat.raw, locale)}
        </p>
      </div>
      <div className="p-4 space-y-4 flex-1">
        <Subsection
          Icon={AlertCircle}
          title={pick(L.identity, locale)}
          subtitle={pick(L.identitySub, locale)}
        >
          <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1.5">
            <p className="text-sm font-medium text-foreground break-words">{hotelName}</p>
            <div className="flex flex-wrap gap-1.5">
              <NoMatchBadge label={pick(L.identityNoMatch, locale)} />
              <NoMatchBadge label={pick(L.identityNoRating, locale)} />
              <NoMatchBadge label={pick(L.identityNoReviews, locale)} />
            </div>
          </div>
        </Subsection>

        <Subsection
          Icon={MapPin}
          title={pick(L.location, locale)}
          subtitle={pick(L.locationSub, locale)}
        >
          <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1.5">
            <p className="text-base font-semibold text-foreground">{destinationLabel}</p>
            <p className="text-xs text-muted-foreground italic">{pick(L.locationBare, locale)}</p>
          </div>
        </Subsection>

        <Subsection
          Icon={Database}
          title={pick(L.content, locale)}
          subtitle={pick(L.contentSub, locale)}
        >
          <ul className="rounded-md border border-border bg-muted/30 p-3 space-y-1 max-h-80 overflow-y-auto">
            {rawList.map((item) => (
              <li
                key={item.id}
                className="flex items-baseline gap-2 text-xs text-foreground"
              >
                <SourceBadge sourceField={item.sourceField} locale={locale} />
                <span className="truncate">
                  {item[locale] || (
                    <span className="italic text-muted-foreground">(empty)</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Subsection>
      </div>
    </div>
  );
}

function Subsection({
  Icon,
  title,
  subtitle,
  children,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <Icon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
            {title}
          </p>
          <p className="text-xs text-muted-foreground leading-snug">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function NoMatchBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
      {label}
    </span>
  );
}

function SourceBadge({ sourceField, locale }: { sourceField: string; locale: Locale }) {
  const text = SOURCE_BADGE[sourceField]?.[locale] ?? sourceField;
  return (
    <span className="inline-flex shrink-0 items-center rounded-sm border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground w-32 justify-center">
      {text}
    </span>
  );
}
