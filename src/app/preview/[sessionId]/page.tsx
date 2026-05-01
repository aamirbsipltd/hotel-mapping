import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { loadSessionWithMatches } from '@/lib/session/load';
import { tripadvisor } from '@/lib/tripadvisor/client';
import { TripadvisorRating } from '@/components/tripadvisor-rating';
import { Card } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TaLocationDetails } from '@/lib/tripadvisor/types';

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function PreviewPage({ params }: PageProps) {
  const { sessionId } = await params;
  const session = await loadSessionWithMatches(sessionId);

  if (!session) notFound();

  const accepted = session.matches.filter(
    (m) => m.status === 'auto_accepted' || m.status === 'accepted',
  );

  // Fetch Tripadvisor details for each accepted match (with 24h cache)
  const detailsMap = new Map<string, TaLocationDetails>();

  await Promise.allSettled(
    accepted
      .filter((m) => m.selectedLocationId)
      .map(async (m) => {
        try {
          const details = await tripadvisor.locationDetails(m.selectedLocationId!);
          detailsMap.set(m.id, details);
        } catch {
          // Skip if details unavailable — card still renders without rating
        }
      }),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href={`/results/${sessionId}`}
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1.5 -ml-2 mb-3')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to results
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Preview integrated output
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {accepted.length} hotel{accepted.length !== 1 ? 's' : ''} matched to Tripadvisor
          </p>
        </div>
      </div>

      {accepted.length === 0 && (
        <div className="rounded-lg border border-border bg-muted/30 px-6 py-12 text-center">
          <p className="text-muted-foreground">
            No accepted matches yet.{' '}
            <Link href={`/results/${sessionId}`} className="text-primary hover:underline">
              Review your results
            </Link>{' '}
            to accept matches.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {accepted.map((match) => {
          const details = detailsMap.get(match.id);

          return (
            <Card key={match.id} className="p-5 space-y-4">
              {/* Two-column layout: your hotel | Tripadvisor data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Source hotel */}
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Your hotel
                  </p>
                  <p className="font-semibold text-foreground">{match.sourceName}</p>
                  <p className="text-sm text-muted-foreground">
                    {[match.sourceCity, match.sourceCountry].filter(Boolean).join(', ')}
                  </p>
                  {match.sourceAddress && (
                    <p className="text-xs text-muted-foreground">{match.sourceAddress}</p>
                  )}
                  {match.selectedLocationId && (
                    <p className="text-xs text-muted-foreground/60 font-mono mt-1">
                      ID: {match.selectedLocationId}
                    </p>
                  )}
                </div>

                {/* Tripadvisor data */}
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Tripadvisor data
                  </p>

                  {details ? (
                    <div className="space-y-2">
                      <p className="font-medium text-foreground">{details.name}</p>
                      {details.address_obj?.address_string && (
                        <p className="text-xs text-muted-foreground">
                          {details.address_obj.address_string}
                        </p>
                      )}
                      <TripadvisorRating details={details} />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {match.selectedLocationId && (
                        <>
                          <p className="text-sm text-muted-foreground">
                            Location ID: {match.selectedLocationId}
                          </p>
                          <a
                            href={`https://www.tripadvisor.com/Hotel_Review-d${match.selectedLocationId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            View on Tripadvisor <ExternalLink className="h-3 w-3" />
                          </a>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Confidence */}
              {match.selectedConfidence != null && (
                <div className="border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground">
                    Match confidence:{' '}
                    <span className="font-medium text-foreground">
                      {(match.selectedConfidence * 100).toFixed(0)}%
                    </span>
                    {match.status === 'accepted' && (
                      <span className="ml-2 text-blue-600">· Manually accepted</span>
                    )}
                    {match.status === 'auto_accepted' && (
                      <span className="ml-2 text-emerald-600">· Auto-accepted</span>
                    )}
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
