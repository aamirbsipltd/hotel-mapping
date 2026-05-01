'use client';

import { useState, useTransition } from 'react';
import { ExternalLink, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfidenceBadge } from './confidence-badge';
import { ScoreBreakdown } from './score-breakdown';
import type { Match } from '@/generated/prisma/client';
import type { ScoredMatch } from '@/lib/matching/score';
import { classify } from '@/lib/matching/score';

type Props = {
  match: Match;
  onDecision?: (matchId: string, accepted: boolean) => void;
};

function parseFirstCandidate(match: Match): ScoredMatch | null {
  if (!match.candidatesJson) return null;
  try {
    const arr = JSON.parse(match.candidatesJson) as ScoredMatch[];
    return arr[0] ?? null;
  } catch {
    return null;
  }
}

function parseAllCandidates(match: Match): ScoredMatch[] {
  if (!match.candidatesJson) return [];
  try {
    return JSON.parse(match.candidatesJson) as ScoredMatch[];
  } catch {
    return [];
  }
}

export function MatchCard({ match, onDecision }: Props) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState(match.status);

  const best = parseFirstCandidate(match);
  const all = parseAllCandidates(match);
  const alternatives = all.slice(1);

  if (!best) {
    return (
      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-foreground">{match.sourceName}</p>
            <p className="text-sm text-muted-foreground">{match.sourceCity}</p>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
            No candidates found
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Try adding coordinates or an address to improve match coverage.
        </p>
      </Card>
    );
  }

  const classification = classify(best.breakdown.totalScore);
  const isReviewable = localStatus === 'manual_review';
  const isAccepted = localStatus === 'auto_accepted' || localStatus === 'accepted';
  const isRejected = localStatus === 'auto_rejected' || localStatus === 'rejected';

  function handleDecision(accepted: boolean) {
    startTransition(async () => {
      try {
        const res = await fetch('/api/decision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matchId: match.id, accepted }),
        });
        if (!res.ok) throw new Error('Failed');
        setLocalStatus(accepted ? 'accepted' : 'rejected');
        onDecision?.(match.id, accepted);
        toast.success(accepted ? 'Match accepted' : 'Match rejected');
      } catch {
        toast.error('Could not save decision. Please try again.');
      }
    });
  }

  return (
    <Card className="p-4 space-y-4">
      {/* Source info */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">
            Your hotel
          </p>
          <p className="font-semibold text-foreground">{match.sourceName}</p>
          <p className="text-sm text-muted-foreground">
            {[match.sourceCity, match.sourceCountry].filter(Boolean).join(', ')}
          </p>
          {match.sourceAddress && (
            <p className="text-xs text-muted-foreground mt-0.5">{match.sourceAddress}</p>
          )}
        </div>
        <ConfidenceBadge
          score={best.breakdown.totalScore}
          classification={isAccepted ? 'auto_accept' : isRejected ? 'auto_reject' : classification}
        />
      </div>

      {/* Best candidate */}
      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Tripadvisor match
        </p>
        <p className="font-medium text-foreground">{best.candidate.name}</p>
        {best.candidate.address && (
          <p className="text-xs text-muted-foreground">{best.candidate.address}</p>
        )}
        {best.breakdown.distanceKm != null && (
          <p className="text-xs text-muted-foreground">
            {best.breakdown.distanceKm < 1
              ? `${(best.breakdown.distanceKm * 1000).toFixed(0)} m away`
              : `${best.breakdown.distanceKm.toFixed(1)} km away`}
          </p>
        )}
        {best.candidate.locationId && (
          <a
            href={`https://www.tripadvisor.com/Hotel_Review-d${best.candidate.locationId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View on Tripadvisor <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Score breakdown */}
      <ScoreBreakdown breakdown={best.breakdown} />

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {isReviewable && !isPending && (
          <>
            <Button
              size="sm"
              variant="default"
              onClick={() => handleDecision(true)}
              className="gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDecision(false)}
              className="gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </Button>
          </>
        )}

        {isAccepted && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDecision(false)}
            className="gap-1.5 text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Undo accept
          </Button>
        )}

        {isRejected && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDecision(true)}
            className="gap-1.5 text-muted-foreground"
          >
            <Check className="h-3.5 w-3.5" />
            Undo reject
          </Button>
        )}

        {alternatives.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowAlternatives((v) => !v)}
            className="gap-1 text-muted-foreground ml-auto"
          >
            {showAlternatives ? (
              <>Hide alternatives <ChevronUp className="h-3.5 w-3.5" /></>
            ) : (
              <>See {alternatives.length} alternative{alternatives.length > 1 ? 's' : ''} <ChevronDown className="h-3.5 w-3.5" /></>
            )}
          </Button>
        )}
      </div>

      {/* Alternatives */}
      {showAlternatives && alternatives.length > 0 && (
        <div className="space-y-2 pt-1">
          {alternatives.map((alt, i) => (
            <div
              key={alt.candidate.locationId ?? i}
              className="rounded-lg border border-border/60 bg-muted/10 p-3 space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{alt.candidate.name}</p>
                <ConfidenceBadge
                  score={alt.breakdown.totalScore}
                  classification={classify(alt.breakdown.totalScore)}
                  className="shrink-0 text-xs"
                />
              </div>
              {alt.candidate.address && (
                <p className="text-xs text-muted-foreground">{alt.candidate.address}</p>
              )}
              <ScoreBreakdown breakdown={alt.breakdown} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
