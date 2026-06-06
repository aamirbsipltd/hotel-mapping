'use client';

// One-glance scorecard — pinned near the top of the page so a skimming
// reader who never scrolls still gets the story.
//
// Engine-derived from the orchestrated view; never hardcoded. The
// "0 misclassified" count is computed, not asserted as a constant, so
// if the engine ever grows a misclassification mode the page stops
// quietly lying.

import { CheckCircle2, MapPin, Sparkles } from 'lucide-react';
import { PLATFORM_LABELS, pick, type Locale, type ScorecardData } from './labels';

type Props = {
  data: ScorecardData;
  locale: Locale;
};

export default function Scorecard({ data, locale }: Props) {
  const L = PLATFORM_LABELS.scorecard;
  const misclassifiedLine =
    locale === 'de'
      ? `${pick(L.content, locale)} — ${data.misclassified} Fehlklassifikationen`
      : `${pick(L.content, locale)} — ${data.misclassified} misclassified`;
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-3">
      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
        <Item Icon={CheckCircle2} label={pick(L.matched, locale)} value={data.matched ? '✓' : '—'} valueIsEmphasis />
        <Item Icon={MapPin} label={pick(L.located, locale)} value={data.regionName} />
        <Item Icon={Sparkles} label={misclassifiedLine} value="✓" valueIsEmphasis />
      </ul>
    </div>
  );
}

function Item({
  Icon,
  label,
  value,
  valueIsEmphasis,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueIsEmphasis?: boolean;
}) {
  return (
    <li className="flex items-center gap-2 min-w-0">
      <Icon className="size-4 text-emerald-700 shrink-0" />
      <span className="font-medium text-emerald-900 truncate">{label}:</span>
      <span
        className={
          (valueIsEmphasis ? 'font-bold text-emerald-700' : 'text-emerald-900') +
          ' truncate'
        }
      >
        {value}
      </span>
    </li>
  );
}
