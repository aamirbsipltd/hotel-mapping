'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';

type Props = {
  sessionId: string;
  initialRowsTotal: number;
  initialRowsProcessed: number;
};

type PollResult = {
  status: string;
  rowsTotal: number;
  rowsProcessed: number;
  currentHotelName: string | null;
};

export function MatchingProgress({
  sessionId,
  initialRowsTotal,
  initialRowsProcessed,
}: Props) {
  const router = useRouter();
  const [data, setData] = useState<PollResult>({
    status: 'processing',
    rowsTotal: initialRowsTotal,
    rowsProcessed: initialRowsProcessed,
    currentHotelName: null,
  });

  useEffect(() => {
    let stopped = false;

    async function poll() {
      while (!stopped) {
        try {
          const res = await fetch(`/api/match/${sessionId}`);
          if (res.ok) {
            const json: PollResult = await res.json();
            setData(json);
            if (json.status === 'done' || json.status === 'failed') {
              router.refresh();
              return;
            }
          }
        } catch {
          // Network error — keep polling
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    poll();
    return () => { stopped = true; };
  }, [sessionId, router]);

  const pct = data.rowsTotal > 0
    ? Math.round((data.rowsProcessed / data.rowsTotal) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-foreground">Matching your hotels…</h2>
        <p className="text-sm text-muted-foreground">
          {data.rowsProcessed} / {data.rowsTotal} processed
        </p>
      </div>

      <Progress value={pct} className="h-2" />

      {data.currentHotelName && (
        <p className="text-sm text-muted-foreground">
          Currently: <span className="font-medium text-foreground">{data.currentHotelName}</span>
        </p>
      )}

      <p className="text-xs text-muted-foreground">Usually takes 30–60 seconds</p>
    </div>
  );
}
