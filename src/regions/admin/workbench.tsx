'use client';

// Region admin workbench — client shell around the map.
//
// Holds the workbench state in React state; every mutation routes through
// an API endpoint that returns the post-mutation state, which we replace
// wholesale. No optimistic UI here — the operator should see what the
// engine actually did. Sidebars use onClick handlers; no HTML <form>.

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WorkbenchState } from '../service/workbench-state';
import type { HotelPoint, GeoPolygonOrMulti } from '../types';
import { MARKER_COLORS, STATE_LABELS, markerState, type MarkerState } from './colors';

const RegionMap = dynamic(() => import('./region-map'), {
  ssr: false,
  loading: () => (
    <div className="h-[640px] w-full rounded-lg border border-border bg-muted/30 grid place-items-center text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

type Props = { initialState: WorkbenchState };

type WorkbenchAssignment = WorkbenchState['assignments'][number];

type DrawDraft = {
  geometry: GeoPolygonOrMulti;
  name: string;
  destinationId: string;
};

export default function RegionWorkbench({ initialState }: Props) {
  const [state, setState] = useState<WorkbenchState>(initialState);
  const [selectedHotelKey, setSelectedHotelKey] = useState<string | null>(null);
  const [drawDraft, setDrawDraft] = useState<DrawDraft | null>(null);
  const [busy, setBusy] = useState<null | string>(null);
  const [error, setError] = useState<string | null>(null);

  const destinationSlugs = useMemo(
    () => state.destinations.map((d) => d.slug),
    [state.destinations],
  );

  const assignmentByKey = useMemo(() => {
    const assignments = state.assignments;
    const m = new Map<string, WorkbenchAssignment>();
    for (const a of assignments) m.set(a.hotelKey, a);
    return m;
  }, [state.assignments]);

  const selectedHotel = useMemo(
    () => state.hotels.find((h) => h.hotelKey === selectedHotelKey) ?? null,
    [state.hotels, selectedHotelKey],
  );
  const selectedAssignment = selectedHotel ? assignmentByKey.get(selectedHotel.hotelKey) : undefined;

  const stateBreakdown = useMemo(() => {
    const tally: Record<MarkerState, number> = {
      auto: 0,
      manual: 0,
      review: 0,
      unassigned: 0,
    };
    for (const h of state.hotels) {
      const a = assignmentByKey.get(h.hotelKey);
      const s = markerState({
        method: a?.method,
        isOverride: a?.isOverride,
        regionId: a?.regionId,
      });
      tally[s]++;
    }
    return tally;
  }, [state.hotels, assignmentByKey]);

  const total = state.hotels.length;
  const tallySum =
    stateBreakdown.auto +
    stateBreakdown.manual +
    stateBreakdown.review +
    stateBreakdown.unassigned;

  const post = useCallback(
    async (
      url: string,
      body: Record<string, unknown> | undefined,
      label: string,
    ): Promise<void> => {
      setBusy(label);
      setError(null);
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `${url} returned ${res.status}`);
        }
        const next = (await res.json()) as WorkbenchState;
        setState(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(null);
      }
    },
    [],
  );

  const handleRunAll = useCallback(() => {
    void post('/api/regions/run', undefined, 'Running assignment…');
  }, [post]);

  const handleSaveDraw = useCallback(() => {
    if (!drawDraft) return;
    const body = {
      name: drawDraft.name.trim(),
      destinationId: drawDraft.destinationId,
      polygon: drawDraft.geometry,
    };
    void (async () => {
      await post('/api/regions', body, 'Saving region…');
      setDrawDraft(null);
    })();
  }, [drawDraft, post]);

  const handleManualAssign = useCallback(
    (regionId: string | null) => {
      if (!selectedHotelKey) return;
      void post(
        '/api/regions/manual-assign',
        { hotelKey: selectedHotelKey, regionId },
        regionId ? 'Saving override…' : 'Clearing override…',
      );
    },
    [post, selectedHotelKey],
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
      <div className="space-y-3">
        <RegionMap
          regions={state.regions}
          hotels={state.hotels}
          assignments={state.assignments.map((a) => ({
            hotelKey: a.hotelKey,
            regionId: a.regionId,
            method: a.method,
            isOverride: a.isOverride,
          }))}
          destinationSlugs={destinationSlugs}
          selectedHotelKey={selectedHotelKey}
          onHotelClick={(h: HotelPoint) => setSelectedHotelKey(h.hotelKey)}
          onPolygonDrawn={(geometry: GeoPolygonOrMulti) =>
            setDrawDraft({
              geometry,
              name: '',
              destinationId: state.destinations[0]?.id ?? '',
            })
          }
        />
        <Legend />
      </div>

      <aside className="space-y-4">
        <StatsCard
          breakdown={stateBreakdown}
          total={total}
          tallySum={tallySum}
          lastRunStats={state.lastRunStats}
        />

        <div className="rounded-lg border border-border bg-background p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Actions
          </p>
          <Button
            type="button"
            onClick={handleRunAll}
            disabled={busy != null}
            className="w-full"
          >
            {busy ?? 'Re-run assignment'}
          </Button>
          {error && (
            <p className="text-xs text-destructive font-medium leading-snug">{error}</p>
          )}
          <p className="text-xs text-muted-foreground leading-snug">
            Manual overrides survive a re-run. Polygon edits take effect on the
            very next run — the index rebuilds from the database each time.
          </p>
        </div>

        {drawDraft && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              New region drawn
            </p>
            <label className="block space-y-1 text-xs">
              <span className="text-muted-foreground">Name</span>
              <input
                type="text"
                value={drawDraft.name}
                onChange={(e) =>
                  setDrawDraft((d) => (d ? { ...d, name: e.target.value } : d))
                }
                className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
                placeholder="Region name"
              />
            </label>
            <label className="block space-y-1 text-xs">
              <span className="text-muted-foreground">Destination</span>
              <select
                value={drawDraft.destinationId}
                onChange={(e) =>
                  setDrawDraft((d) => (d ? { ...d, destinationId: e.target.value } : d))
                }
                className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
              >
                {state.destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleSaveDraw}
                disabled={!drawDraft.name.trim() || !drawDraft.destinationId || busy != null}
                className="flex-1"
              >
                Save + re-run
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDrawDraft(null)}
              >
                Discard
              </Button>
            </div>
          </div>
        )}

        {selectedHotel && (
          <HotelSidebar
            hotel={selectedHotel}
            assignment={selectedAssignment}
            regions={state.regions}
            disabled={busy != null}
            onAssign={handleManualAssign}
            onClose={() => setSelectedHotelKey(null)}
          />
        )}
      </aside>
    </div>
  );
}

function StatsCard({
  breakdown,
  total,
  tallySum,
  lastRunStats,
}: {
  breakdown: Record<MarkerState, number>;
  total: number;
  tallySum: number;
  lastRunStats: WorkbenchState['lastRunStats'];
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Current state
        </p>
        <p className="text-xs text-muted-foreground">
          {tallySum} / {total} accounted for
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-2">
        {(['auto', 'manual', 'review', 'unassigned'] as MarkerState[]).map((s) => (
          <li
            key={s}
            className="rounded-md border border-border px-2 py-1.5"
          >
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block size-2 rounded-full"
                style={{ background: MARKER_COLORS[s] }}
              />
              <span className="text-xs text-muted-foreground">{STATE_LABELS[s]}</span>
            </div>
            <p className="text-lg font-bold tabular-nums text-foreground">
              {breakdown[s]}
            </p>
          </li>
        ))}
      </ul>
      {lastRunStats && (
        <p className="text-xs text-muted-foreground leading-snug">
          Last run: {lastRunStats.auto} auto · {lastRunStats.manualPreserved} preserved · {lastRunStats.review} review · {lastRunStats.unassigned} unassigned · {(lastRunStats.autoRate * 100).toFixed(1)}% auto-rate
        </p>
      )}
    </div>
  );
}

function HotelSidebar({
  hotel,
  assignment,
  regions,
  disabled,
  onAssign,
  onClose,
}: {
  hotel: HotelPoint;
  assignment: WorkbenchAssignment | undefined;
  regions: WorkbenchState['regions'];
  disabled: boolean;
  onAssign: (regionId: string | null) => void;
  onClose: () => void;
}) {
  const currentRegion = regions.find((r) => r.id === assignment?.regionId);
  return (
    <div className="rounded-lg border border-border bg-background p-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Hotel
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Close
        </button>
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">{hotel.name}</p>
        <p className="text-xs font-mono text-muted-foreground">{hotel.hotelKey}</p>
        <p className="text-xs text-muted-foreground">
          {hotel.lat.toFixed(5)}, {hotel.lng.toFixed(5)}
        </p>
      </div>
      <div className="space-y-1 text-xs">
        <p>
          Current:{' '}
          <span className="font-medium text-foreground">
            {currentRegion ? currentRegion.name : 'unassigned'}
          </span>
        </p>
        <p>
          Method:{' '}
          <span className="font-mono">{assignment?.method ?? '—'}</span>
          {assignment?.isOverride ? ' · override' : ''}
          {assignment?.confidence != null ? ` · conf ${assignment.confidence.toFixed(2)}` : ''}
        </p>
        {assignment?.candidateRegionIds.length ? (
          <p className="text-muted-foreground">
            Candidates: {assignment.candidateRegionIds
              .map((id) => regions.find((r) => r.id === id)?.name ?? id)
              .join(', ')}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Reassign to
        </p>
        <select
          defaultValue={assignment?.regionId ?? ''}
          onChange={(e) => onAssign(e.target.value === '' ? null : e.target.value)}
          disabled={disabled}
          className={cn(
            'w-full rounded-md border border-border bg-background px-2 py-1 text-sm',
            disabled && 'opacity-60',
          )}
        >
          <option value="">— unassign —</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.destinationName} · {r.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      {(['auto', 'manual', 'review', 'unassigned'] as MarkerState[]).map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <span
            className="inline-block size-2 rounded-full"
            style={{ background: MARKER_COLORS[s] }}
          />
          {STATE_LABELS[s]}
        </span>
      ))}
    </div>
  );
}
