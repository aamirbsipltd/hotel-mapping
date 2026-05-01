import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Download, Eye } from 'lucide-react';
import { loadSessionWithMatches } from '@/lib/session/load';
import { MatchingProgress } from '@/components/matching-progress';
import { MatchCard } from '@/components/match-card';
import { buttonVariants } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { Match } from '@/generated/prisma/client';
import { classify } from '@/lib/matching/score';
import type { ScoredMatch } from '@/lib/matching/score';

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

function getMatchClassification(match: Match): 'auto_accept' | 'manual_review' | 'auto_reject' | null {
  if (!match.candidatesJson) return null;
  try {
    const arr = JSON.parse(match.candidatesJson) as ScoredMatch[];
    const best = arr[0];
    if (!best) return null;
    return classify(best.breakdown.totalScore);
  } catch {
    return null;
  }
}

export default async function ResultsPage({ params }: PageProps) {
  const { sessionId } = await params;
  const session = await loadSessionWithMatches(sessionId);

  if (!session) notFound();

  const isProcessing = session.status === 'queued' || session.status === 'processing';

  if (isProcessing) {
    return (
      <MatchingProgress
        sessionId={sessionId}
        initialRowsTotal={session.rowsTotal}
        initialRowsProcessed={session.rowsProcessed}
      />
    );
  }

  const matches = session.matches;

  const autoAccepted = matches.filter(
    (m) => m.status === 'auto_accepted' || m.status === 'accepted',
  );
  const reviewNeeded = matches.filter((m) => m.status === 'manual_review');
  const noMatch = matches.filter(
    (m) => m.status === 'no_candidates' || m.status === 'auto_rejected' || m.status === 'rejected',
  );
  const withError = matches.filter((m) => m.status === 'error');

  const allDone = reviewNeeded.length === 0;
  const defaultTab = reviewNeeded.length > 0 ? 'review' : 'accepted';

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {allDone ? 'Mapping complete' : 'Matching results'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {matches.length} hotel{matches.length !== 1 ? 's' : ''} processed
            {!session.isPaid && (
              <span className="ml-2 text-amber-600">
                · Demo (first {matches.length} rows only)
              </span>
            )}
          </p>
        </div>

        {allDone && (
          <div className="flex gap-2 shrink-0">
            <Link
              href={`/preview/${sessionId}`}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
            >
              <Eye className="h-4 w-4" />
              Preview
            </Link>
            <a
              href={`/api/export/${sessionId}`}
              download
              className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
            >
              <Download className="h-4 w-4" />
              Download CSV
            </a>
          </div>
        )}
      </div>

      {/* Summary when done */}
      {allDone && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Auto-accepted', count: autoAccepted.length, color: 'text-emerald-600' },
            { label: 'Manually reviewed', count: matches.filter((m) => m.status === 'accepted' || m.status === 'rejected').length, color: 'text-blue-600' },
            { label: 'No match found', count: noMatch.length, color: 'text-muted-foreground' },
            { label: 'Errors', count: withError.length, color: 'text-red-600' },
          ].map(({ label, count, color }) => (
            <div key={label} className="rounded-lg border border-border p-3 text-center">
              <p className={`text-2xl font-bold tabular-nums ${color}`}>{count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Demo upsell */}
      {!session.isPaid && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800">
            Demo: showing first {matches.length} rows only.
          </p>
          <Link
            href="/pricing"
            className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100')}
          >
            Unlock Pro $99 →
          </Link>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="all">
            All ({matches.length})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Auto-accepted ({autoAccepted.length})
          </TabsTrigger>
          <TabsTrigger value="review">
            Review needed ({reviewNeeded.length})
          </TabsTrigger>
          <TabsTrigger value="no-match">
            No match ({noMatch.length + withError.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-3">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </TabsContent>

        <TabsContent value="accepted" className="mt-4 space-y-3">
          {autoAccepted.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No auto-accepted matches yet.
            </p>
          )}
          {autoAccepted.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </TabsContent>

        <TabsContent value="review" className="mt-4 space-y-3">
          {reviewNeeded.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No matches need review. Ready to export.
            </p>
          )}
          {reviewNeeded.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </TabsContent>

        <TabsContent value="no-match" className="mt-4 space-y-3">
          {[...noMatch, ...withError].length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              All hotels found a match.
            </p>
          )}
          {[...noMatch, ...withError].map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </TabsContent>
      </Tabs>

      {/* Bottom export bar when done */}
      {allDone && (
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
          <a
            href={`/api/export/${sessionId}`}
            download
            className={cn(buttonVariants(), 'flex-1 gap-2')}
          >
            <Download className="h-4 w-4" />
            Download mapped CSV
          </a>
          <Link
            href={`/preview/${sessionId}`}
            className={cn(buttonVariants({ variant: 'outline' }), 'flex-1 gap-2')}
          >
            <Eye className="h-4 w-4" />
            Preview integrated output
          </Link>
        </div>
      )}
    </div>
  );
}
