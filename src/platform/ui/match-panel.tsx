'use client';

// Match panel — "which real-world property is this?"
//
// **The four signals are inspectable, not collapsed behind a green check.**
// The 0.50 address signal is rendered with an amber bar so the panel
// surfaces *why* the headline confidence is 0.90, not 1.0 — the same
// "show why" discipline the region review queue uses.

import { CheckCircle2, XCircle, Star } from 'lucide-react';
import { PLATFORM_LABELS, pick, type Locale } from './labels';
import type { PlatformMatch } from '../orchestrate';

type Props = {
  match: PlatformMatch;
  beat: string;
  locale: Locale;
};

export default function MatchPanel({ match, beat, locale }: Props) {
  const L = PLATFORM_LABELS.matchField;
  const phrase = pick(PLATFORM_LABELS.classificationPhrase[match.classification], locale);
  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden">
      <header className="px-4 py-3 border-b border-emerald-100 bg-emerald-50/40 space-y-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {pick(PLATFORM_LABELS.panel.match, locale)}
          </p>
          <ClassificationBadge classification={match.classification} phrase={phrase} />
        </div>
        <p className="text-xs text-emerald-900/80 leading-snug">{beat}</p>
      </header>

      <div className="p-4 space-y-4">
        <div className="space-y-1">
          <p className="text-base font-semibold text-foreground break-words">{match.placeName}</p>
          <p className="text-xs font-mono text-muted-foreground break-all">{match.placeId}</p>
          <p className="text-xs text-muted-foreground leading-snug break-words">
            <span className="font-medium">{pick(L.placeAddress, locale)}: </span>
            {match.placeAddress}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label={pick(L.confidence, locale)} value={(match.confidence * 100).toFixed(0) + '%'} accent="emerald" />
          <Stat
            label={pick(L.rating, locale)}
            value={
              <span className="inline-flex items-center gap-1">
                <Star className="size-3.5 fill-amber-400 stroke-amber-500" />
                {match.rating.toFixed(1)}
              </span>
            }
          />
          <Stat label={pick(L.reviews, locale)} value={match.reviewCount.toLocaleString(locale === 'de' ? 'de-DE' : 'en-US')} />
          <Stat
            label={pick(L.distance, locale)}
            value={
              match.distanceKm !== null
                ? `${(match.distanceKm * 1000).toFixed(0)} m`
                : '—'
            }
          />
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {pick(L.signals, locale)}
            </p>
            <p className="text-xs text-muted-foreground leading-snug">
              {pick(L.signalsSub, locale)}
            </p>
          </div>
          <ul className="space-y-1.5">
            <SignalRow label={pick(PLATFORM_LABELS.matchSignal.name, locale)} score={match.signals.nameScore} locale={locale} />
            <SignalRow label={pick(PLATFORM_LABELS.matchSignal.distance, locale)} score={match.signals.distanceScore} locale={locale} />
            <SignalRow label={pick(PLATFORM_LABELS.matchSignal.address, locale)} score={match.signals.addressScore} locale={locale} />
            <PhoneRow label={pick(PLATFORM_LABELS.matchSignal.phone, locale)} matched={match.signals.phoneMatch} locale={locale} />
          </ul>
        </div>
      </div>
    </div>
  );
}

function ClassificationBadge({
  classification,
  phrase,
}: {
  classification: PlatformMatch['classification'];
  phrase: string;
}) {
  const styles: Record<typeof classification, string> = {
    auto_accept: 'border-emerald-300 bg-emerald-100 text-emerald-900',
    manual_review: 'border-amber-300 bg-amber-100 text-amber-900',
    auto_reject: 'border-slate-300 bg-slate-100 text-slate-700',
  };
  return (
    <span
      className={
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ' +
        styles[classification]
      }
    >
      {classification === 'auto_accept' && <CheckCircle2 className="size-3" />}
      {phrase}
    </span>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: 'emerald';
}) {
  const valueClass = accent === 'emerald' ? 'text-emerald-700' : 'text-foreground';
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

function strengthBucket(score: number): 'strong' | 'partial' | 'weak' {
  if (score >= 0.85) return 'strong';
  if (score >= 0.45) return 'partial';
  return 'weak';
}

function SignalRow({
  label,
  score,
  locale,
}: {
  label: string;
  score: number;
  locale: Locale;
}) {
  const bucket = strengthBucket(score);
  const colors = {
    strong: { bar: '#059669', label: 'text-emerald-700' },
    partial: { bar: '#d97706', label: 'text-amber-700' },
    weak: { bar: '#94a3b8', label: 'text-slate-500' },
  }[bucket];
  const strengthText = pick(
    bucket === 'strong'
      ? PLATFORM_LABELS.matchSignal.strengthStrong
      : bucket === 'partial'
        ? PLATFORM_LABELS.matchSignal.strengthPartial
        : PLATFORM_LABELS.matchSignal.strengthWeak,
    locale,
  );
  return (
    <li className="grid grid-cols-[80px_1fr_80px] gap-2 items-center text-xs">
      <span className="text-foreground truncate">{label}</span>
      <span className="h-1.5 rounded-full bg-slate-100">
        <span
          className="block h-full rounded-full"
          style={{ width: `${Math.max(0, Math.min(1, score)) * 100}%`, background: colors.bar }}
        />
      </span>
      <span className={'font-mono tabular-nums text-right ' + colors.label}>
        {score.toFixed(2)} · {strengthText}
      </span>
    </li>
  );
}

function PhoneRow({
  label,
  matched,
  locale,
}: {
  label: string;
  matched: boolean;
  locale: Locale;
}) {
  const phrase = pick(
    matched ? PLATFORM_LABELS.matchSignal.phoneMatched : PLATFORM_LABELS.matchSignal.phoneNoMatch,
    locale,
  );
  return (
    <li className="grid grid-cols-[80px_1fr_80px] gap-2 items-center text-xs">
      <span className="text-foreground truncate">{label}</span>
      <span className="flex items-center gap-1.5">
        {matched ? (
          <CheckCircle2 className="size-3.5 text-emerald-600" />
        ) : (
          <XCircle className="size-3.5 text-slate-400" />
        )}
        <span className={matched ? 'text-emerald-700' : 'text-slate-500'}>{phrase}</span>
      </span>
      <span aria-hidden className="" />
    </li>
  );
}
