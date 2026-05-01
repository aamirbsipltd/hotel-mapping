import type { ScoreBreakdown } from '@/lib/matching/score';

type Props = {
  breakdown: ScoreBreakdown;
};

function Bar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
        {(value * 100).toFixed(0)}%
      </span>
    </div>
  );
}

export function ScoreBreakdown({ breakdown }: Props) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 space-y-2.5 text-sm">
      <div className="grid grid-cols-[120px_1fr] items-center gap-x-3 gap-y-2">
        <span className="text-xs text-muted-foreground font-medium">Name similarity</span>
        <Bar value={breakdown.nameScore} />

        <span className="text-xs text-muted-foreground font-medium">
          Distance
          {breakdown.distanceKm != null && (
            <span className="ml-1 text-muted-foreground/70">
              ({breakdown.distanceKm < 1
                ? `${(breakdown.distanceKm * 1000).toFixed(0)}m`
                : `${breakdown.distanceKm.toFixed(1)}km`})
            </span>
          )}
        </span>
        {breakdown.distanceKm != null ? (
          <Bar value={breakdown.distanceScore} />
        ) : (
          <span className="text-xs text-muted-foreground/60 italic">No coordinates</span>
        )}

        <span className="text-xs text-muted-foreground font-medium">Address</span>
        {breakdown.addressScore > 0 ? (
          <Bar value={breakdown.addressScore} />
        ) : (
          <span className="text-xs text-muted-foreground/60 italic">No address data</span>
        )}

        <span className="text-xs text-muted-foreground font-medium">Phone</span>
        <span className={`text-xs ${breakdown.phoneMatch ? 'text-emerald-700' : 'text-muted-foreground/60 italic'}`}>
          {breakdown.phoneMatch ? 'Match ✓' : 'No match'}
        </span>
      </div>
    </div>
  );
}
