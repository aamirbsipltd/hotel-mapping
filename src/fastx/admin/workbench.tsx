'use client';

// FastX classification workbench.
//
// Lifts the structure from src/regions/admin/workbench.tsx:
//   • Single-fetch — every mutation POSTs and replaces the entire
//     WorkbenchState from the response. No optimistic UI.
//   • No HTML <form> anywhere — onClick / onChange handlers only.
//   • State is held in one React state object; the API layer is the
//     source of truth.
//
// The hotel selector switches the displayed run via the GET endpoint.
// "Classify" triggers a fresh run for either a fixture or the
// paste-JSON textarea. "Approve" persists the operator's decision via
// /api/fastx/resolve — the next "Classify" call hits the just-written
// AmenityMapping row in Stage 1 and the auto-rate moves visibly.

import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CATEGORIES, NON_AMENITY_BUCKETS, ORDERED_CATEGORY_IDS, type BucketId, type CategoryId } from '@/fastx/taxonomy';
import { BUCKET_ICONS, CATEGORY_ICONS } from '@/fastx/taxonomy-icons';
import { FASTX_ROW_COLORS, FASTX_ROW_LABELS, type FastxRowState } from './colors';
import type { WorkbenchState, WorkbenchRun } from '@/fastx/service/workbench-state';
import type { ReviewItemView } from '@/fastx/service/store';
import type { AmenityItem } from '@/fastx/classify/types';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

type Props = { initialState: WorkbenchState };

type Busy = null | 'classify' | 'classify-paste' | { kind: 'resolve'; id: string };

export default function FastXWorkbench({ initialState }: Props) {
  const [state, setState] = useState<WorkbenchState>(initialState);
  const [paste, setPaste] = useState('');
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [pasteError, setPasteError] = useState<string | null>(null);

  const replaceFromResponse = useCallback(async (res: Response) => {
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `${res.url} returned ${res.status}`);
    }
    const body = (await res.json()) as WorkbenchState | { runId: string; state: WorkbenchState };
    if ('state' in body) setState(body.state);
    else setState(body);
  }, []);

  const handleSelectHotel = useCallback(async (hotelCode: string | null) => {
    setError(null);
    setBusy('classify');
    try {
      const url = hotelCode
        ? `/api/fastx?hotelCode=${encodeURIComponent(hotelCode)}`
        : '/api/fastx';
      const res = await fetch(url);
      await replaceFromResponse(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }, [replaceFromResponse]);

  const handleClassifyFixture = useCallback(async () => {
    if (!state.hotelCode) return;
    setError(null);
    setBusy('classify');
    try {
      const res = await fetch('/api/fastx/classify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ hotelCode: state.hotelCode }),
      });
      await replaceFromResponse(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }, [state.hotelCode, replaceFromResponse]);

  const handleClassifyPaste = useCallback(async () => {
    setError(null);
    setPasteError(null);
    let hotelData: unknown;
    try {
      hotelData = JSON.parse(paste);
    } catch (e) {
      setPasteError(`That is not valid JSON: ${e instanceof Error ? e.message : String(e)}`);
      return;
    }
    setBusy('classify-paste');
    try {
      const res = await fetch('/api/fastx/classify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ hotelData }),
      });
      if (!res.ok) {
        // Validation error from zod → surface to the textarea, not the
        // top-level banner, so the operator sees it next to the input.
        const text = await res.text();
        setPasteError(text);
        return;
      }
      await replaceFromResponse(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }, [paste, replaceFromResponse]);

  const handleResolve = useCallback(
    async (reviewItemId: string, categoryId: string) => {
      if (!state.hotelCode) return;
      setError(null);
      setBusy({ kind: 'resolve', id: reviewItemId });
      try {
        const res = await fetch('/api/fastx/resolve', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            reviewItemId,
            categoryId,
            hotelCode: state.hotelCode,
          }),
        });
        await replaceFromResponse(res);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(null);
      }
    },
    [state.hotelCode, replaceFromResponse],
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
      <div className="space-y-4">
        <SelectorPanel
          available={state.available}
          hotelCode={state.hotelCode}
          paste={paste}
          pasteError={pasteError}
          busy={busy}
          onSelectHotel={handleSelectHotel}
          onClassifyFixture={handleClassifyFixture}
          onPasteChange={setPaste}
          onClassifyPaste={handleClassifyPaste}
        />

        {state.latestRun ? (
          <ResultsTable run={state.latestRun} />
        ) : (
          <EmptyState />
        )}
      </div>

      <aside className="space-y-4">
        <StatsCard run={state.latestRun} />
        {state.latestRun && (
          <ReviewQueue
            run={state.latestRun}
            busy={busy}
            onResolve={handleResolve}
          />
        )}
        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}
      </aside>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SelectorPanel({
  available,
  hotelCode,
  paste,
  pasteError,
  busy,
  onSelectHotel,
  onClassifyFixture,
  onPasteChange,
  onClassifyPaste,
}: {
  available: WorkbenchState['available'];
  hotelCode: string | null;
  paste: string;
  pasteError: string | null;
  busy: Busy;
  onSelectHotel: (hotelCode: string | null) => void;
  onClassifyFixture: () => void;
  onPasteChange: (v: string) => void;
  onClassifyPaste: () => void;
}) {
  const isBusy = busy !== null;
  return (
    <div className="rounded-lg border border-border bg-background p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Source
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <label className="flex-1 space-y-1 text-xs">
          <span className="text-muted-foreground">Fixture</span>
          <select
            value={hotelCode ?? ''}
            onChange={(e) => onSelectHotel(e.target.value || null)}
            disabled={isBusy}
            className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
          >
            <option value="">— pick a hotel —</option>
            {available.map((h) => (
              <option key={h.hotelCode} value={h.hotelCode}>
                {h.hotelName} ({h.hotelCode})
              </option>
            ))}
          </select>
        </label>
        <Button
          type="button"
          onClick={onClassifyFixture}
          disabled={!hotelCode || isBusy}
          className="self-end"
        >
          {busy === 'classify' ? 'Classifying…' : 'Classify selected'}
        </Button>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          …or paste a <code className="font-mono">HotelData</code> JSON payload (HotelX shape):
        </p>
        <textarea
          value={paste}
          onChange={(e) => onPasteChange(e.target.value)}
          rows={6}
          spellCheck={false}
          disabled={isBusy}
          placeholder='{ "hotelCode": "TGX-…", "hotelName": "…", "cardTypes": [...], "allAmenities": { "edges": [...] }, ... }'
          className="w-full rounded-md border border-border bg-background px-2 py-2 text-xs font-mono leading-relaxed"
        />
        {pasteError && (
          <p className="text-xs text-destructive font-medium leading-snug">
            {pasteError}
          </p>
        )}
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClassifyPaste}
            disabled={!paste.trim() || isBusy}
          >
            {busy === 'classify-paste' ? 'Classifying…' : 'Classify pasted JSON'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center space-y-2">
      <p className="text-sm font-medium text-foreground">No run yet.</p>
      <p className="text-xs text-muted-foreground">
        Pick a fixture or paste a HotelData payload, then click classify.
      </p>
    </div>
  );
}

function StatsCard({ run }: { run: WorkbenchRun | null }) {
  if (!run) {
    return (
      <div className="rounded-lg border border-border bg-background p-4 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Stats
        </p>
        <p className="text-xs text-muted-foreground">No run on file.</p>
      </div>
    );
  }
  const s = run.stats;
  const pct = (s.autoRate * 100).toFixed(1);
  const tiles: { id: FastxRowState; n: number }[] = [
    { id: 'auto', n: s.auto },
    { id: 'review', n: s.review },
    { id: 'payment', n: s.payment },
    { id: 'nearby', n: s.nearby },
    { id: 'excluded', n: s.excluded },
  ];
  return (
    <div className="rounded-lg border border-border bg-background p-4 space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Stats
        </p>
        <p className="text-xs text-muted-foreground">
          total {s.total}
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-2">
        {tiles.map((t) => (
          <li key={t.id} className="rounded-md border border-border px-2 py-1.5">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block size-2 rounded-full"
                style={{ background: FASTX_ROW_COLORS[t.id] }}
              />
              <span className="text-xs text-muted-foreground">{FASTX_ROW_LABELS[t.id]}</span>
            </div>
            <p className="text-lg font-bold tabular-nums text-foreground">{t.n}</p>
          </li>
        ))}
      </ul>
      <div className="rounded-md border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-xs">
        <p className="font-semibold text-emerald-900">{pct}% auto-rate</p>
        <p className="text-emerald-900/70">
          denominator: {s.autoRateDenominator} ({s.auto} auto + {s.review} review).{' '}
          Re-homed and excluded items are not amenities and aren&apos;t in the rate.
        </p>
      </div>
    </div>
  );
}

function ReviewQueue({
  run,
  busy,
  onResolve,
}: {
  run: WorkbenchRun;
  busy: Busy;
  onResolve: (reviewItemId: string, categoryId: string) => void;
}) {
  const pending = run.reviewItems.filter((r) => r.status === 'PENDING');
  const resolved = run.reviewItems.filter((r) => r.status === 'RESOLVED');
  return (
    <div className="rounded-lg border border-border bg-background p-4 space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Review queue
        </p>
        <p className="text-xs text-muted-foreground">
          {pending.length} pending · {resolved.length} resolved
        </p>
      </div>
      {pending.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          Nothing in the queue. {resolved.length > 0 && 'Re-classify this hotel to apply the resolved decisions.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {pending.map((item) => (
            <PendingReviewCard
              key={item.id}
              item={item}
              busy={busy}
              onResolve={onResolve}
            />
          ))}
        </ul>
      )}
      {resolved.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Resolved on this run ({resolved.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {resolved.map((item) => (
              <li key={item.id} className="flex items-center gap-1.5 text-foreground">
                <CheckCircle2 className="size-3 text-emerald-600" />
                <span className="truncate flex-1">{item.rawText}</span>
                <span className="text-muted-foreground">→ {item.resolvedCategoryId}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function PendingReviewCard({
  item,
  busy,
  onResolve,
}: {
  item: ReviewItemView;
  busy: Busy;
  onResolve: (reviewItemId: string, categoryId: string) => void;
}) {
  const isBusy = busy !== null;
  const isThisOneBusy = typeof busy === 'object' && busy?.id === item.id;
  const [picked, setPicked] = useState<string>(item.suggestedCategoryId ?? '');
  const subThreshold = !item.suggestedCategoryId;
  return (
    <li className="rounded-md border border-amber-200 bg-amber-50/40 p-3 space-y-2">
      <div className="flex items-start gap-2">
        <AlertTriangle className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{item.rawText}</p>
          <p className="text-xs text-muted-foreground">
            confidence {item.confidence.toFixed(2)} · method {item.method} · source {item.sourceField}
          </p>
          {subThreshold ? (
            <p className="text-xs text-amber-900/70 italic">
              Needs human — no suggestion (sub-threshold).
            </p>
          ) : (
            <p className="text-xs text-amber-900/70">
              Suggested: {item.suggestedCategoryId}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <select
          value={picked}
          onChange={(e) => setPicked(e.target.value)}
          disabled={isBusy}
          className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs"
        >
          <option value="">— pick a category —</option>
          {ORDERED_CATEGORY_IDS.map((id) => (
            <option key={id} value={id}>
              {CATEGORIES[id].labels.en}
            </option>
          ))}
        </select>
        <Button
          type="button"
          size="sm"
          onClick={() => picked && onResolve(item.id, picked)}
          disabled={!picked || isBusy}
        >
          {isThisOneBusy ? 'Saving…' : 'Approve'}
        </Button>
      </div>
    </li>
  );
}

function ResultsTable({ run }: { run: WorkbenchRun }) {
  // Snapshot of the run's result — no client-side classification, no
  // dictionary state to chase. The stats panel above and this table both
  // read from the same persisted JSON.
  const buckets = useMemo(() => buildBuckets(run), [run]);
  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden">
      <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-baseline justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Classification result
        </p>
        <p className="text-xs text-muted-foreground">
          {run.hotelName ?? run.hotelCode} · {new Date(run.createdAt).toLocaleString()}
        </p>
      </div>
      <div className="divide-y divide-border">
        {buckets.map((bucket) => (
          <BucketBlock key={bucket.key} bucket={bucket} />
        ))}
      </div>
    </div>
  );
}

type Bucket = {
  key: string;
  label: string;
  state: FastxRowState;
  Icon?: React.ComponentType<{ className?: string }>;
  rows: AmenityItem[];
};

function BucketBlock({ bucket }: { bucket: Bucket }) {
  if (bucket.rows.length === 0) return null;
  const color = FASTX_ROW_COLORS[bucket.state];
  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center gap-1.5">
        <span className="inline-block size-2.5 rounded-full" style={{ background: color }} />
        {bucket.Icon ? <bucket.Icon className="size-4 text-foreground" /> : null}
        <p className="text-sm font-semibold text-foreground">{bucket.label}</p>
        <p className="ml-auto text-xs text-muted-foreground">{bucket.rows.length}</p>
      </div>
      <ul className="space-y-1">
        {bucket.rows.map((row, i) => (
          <ResultRow key={`${row.rawText}-${i}`} row={row} stateColor={color} />
        ))}
      </ul>
    </div>
  );
}

function ResultRow({ row, stateColor }: { row: AmenityItem; stateColor: string }) {
  const conf = Math.max(0, Math.min(1, row.confidence));
  return (
    <li className="grid grid-cols-[16px_1fr_140px_140px_120px] gap-2 items-center text-xs">
      <span
        className="inline-block size-1.5 rounded-full justify-self-center"
        style={{ background: stateColor }}
      />
      <span className="truncate text-foreground">{row.rawText || <span className="italic text-muted-foreground">(empty)</span>}</span>
      <span className="text-muted-foreground">{row.sourceField}</span>
      <div className="flex items-center gap-1.5" title={`confidence ${conf.toFixed(2)}`}>
        <span className="h-1.5 flex-1 rounded-full bg-muted">
          <span
            className="block h-full rounded-full"
            style={{ width: `${(conf * 100).toFixed(0)}%`, background: stateColor }}
          />
        </span>
        <span className="font-mono text-muted-foreground tabular-nums">
          {conf.toFixed(2)}
        </span>
      </div>
      <span className="text-muted-foreground font-mono uppercase tracking-wide">
        {row.method}
      </span>
    </li>
  );
}

function buildBuckets(run: WorkbenchRun): Bucket[] {
  const r = run.result;
  const buckets: Bucket[] = [];
  for (const id of ORDERED_CATEGORY_IDS) {
    const rows = r.categories[id as CategoryId];
    if (!rows || rows.length === 0) continue;
    buckets.push({
      key: id,
      label: CATEGORIES[id].labels.en,
      state: 'auto',
      Icon: CATEGORY_ICONS[id as CategoryId],
      rows,
    });
  }
  if (r.review.length > 0) {
    buckets.push({
      key: '_review',
      label: 'Needs review',
      state: 'review',
      Icon: AlertTriangle,
      rows: r.review,
    });
  }
  const nonAmenityBuckets: { id: BucketId; state: FastxRowState; rows: AmenityItem[] }[] = [
    { id: '_payment', state: 'payment', rows: r.payment },
    { id: '_nearby', state: 'nearby', rows: r.nearby },
    { id: '_excluded', state: 'excluded', rows: r.excluded },
  ];
  for (const b of nonAmenityBuckets) {
    if (b.rows.length === 0) continue;
    const meta = NON_AMENITY_BUCKETS[b.id as '_payment' | '_nearby' | '_excluded'];
    buckets.push({
      key: b.id,
      label: meta.labels.en,
      state: b.state,
      Icon: BUCKET_ICONS[b.id as '_payment' | '_nearby' | '_excluded'],
      rows: b.rows,
    });
  }
  return buckets;
}
