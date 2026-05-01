import { Badge } from '@/components/ui/badge';
import type { Classification } from '@/lib/matching/score';
import { cn } from '@/lib/utils';

type Props = {
  score: number;
  classification: Classification;
  className?: string;
};

export function ConfidenceBadge({ score, classification, className }: Props) {
  const pct = (score * 100).toFixed(0) + '%';

  const variants: Record<Classification, string> = {
    auto_accept:   'bg-emerald-100 text-emerald-800 border-emerald-200',
    manual_review: 'bg-amber-100 text-amber-800 border-amber-200',
    auto_reject:   'bg-red-100 text-red-700 border-red-200',
  };

  const labels: Record<Classification, string> = {
    auto_accept:   'Auto-accepted',
    manual_review: 'Review needed',
    auto_reject:   'Rejected',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variants[classification],
        className,
      )}
    >
      <span className="tabular-nums font-semibold">{pct}</span>
      <span>—</span>
      <span>{labels[classification]}</span>
    </span>
  );
}
