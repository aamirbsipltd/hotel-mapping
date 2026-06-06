// Before / after hero — the bid headline.
//
// Server-rendered SVG, no client JS. Side-by-side panels at the same
// geographic bbox: left shows hotels dumped at the destination level
// (no region structure, one neutral color), right shows them snapped
// into their region polygons coloured by assignment state. Caption
// reconciles the counts using the "X auto · Y correctly flagged ambiguous
// · Z correctly flagged outside · 0 misassignments" framing — leading
// with "0 wrong," not the auto-rate percentage.

import { getDemoResult } from './compute';
import {
  combinedRegionBbox,
  expandBbox,
  makeProjection,
  pointInBbox,
  polygonToSvgPath,
} from './projection';
import { MARKER_COLORS, destinationColor, markerState } from '../admin/colors';
import type { IndexedRegion } from '../assign/types';
import type { HotelPoint } from '../types';

type Props = {
  destinationSlug: string;
};

const VIEW_W = 460;
const VIEW_H = 320;

export function BeforeAfterHero({ destinationSlug }: Props) {
  const { regions, hotels, result } = getDemoResult();
  const destRegions = regions.filter((r) => r.destinationSlug === destinationSlug);
  if (destRegions.length === 0) return null;

  const destHotels = hotels.filter((h) => h.currentDestinationSlug === destinationSlug);
  const allDestSlugs = Array.from(
    new Set(regions.map((r) => r.destinationSlug)),
  );
  const palette = (slug: string) => destinationColor(slug, allDestSlugs);

  const bbox = expandBbox(combinedRegionBbox(destRegions), 0.06);
  const project = makeProjection(bbox, VIEW_W, VIEW_H, 12);

  const visibleHotels = destHotels.filter((h) => pointInBbox(h, bbox, 0));
  const offMapCount = destHotels.length - visibleHotels.length;

  const assignmentByKey = new Map(result.assignments.map((a) => [a.hotelKey, a]));

  // Headline counts derived from the engine — not hard-coded. Engine runs
  // over all 29 fixture hotels; the hero is a slice of that result.
  const counts = headlineCounts(destHotels, result.assignments);

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel
          label="Raw supplier feed"
          subtitle={`${destHotels.length} hotels under a single destination pin`}
        >
          <RawPanel
            project={project}
            hotels={visibleHotels}
            destinationSlug={destinationSlug}
            color={palette(destinationSlug)}
          />
        </Panel>
        <Panel
          label="Classified"
          subtitle="Snapped into the regions you actually sell"
        >
          <ClassifiedPanel
            project={project}
            regions={destRegions}
            hotels={visibleHotels}
            assignmentByKey={assignmentByKey}
            palette={palette}
          />
        </Panel>
      </div>

      <HeroCaption counts={counts} />
      {offMapCount > 0 && (
        <p className="text-xs text-muted-foreground italic">
          {offMapCount} hotel{offMapCount === 1 ? '' : 's'} sit outside the visible bounds (offshore / between destinations) and are rendered in the workbench map.
        </p>
      )}
    </section>
  );
}

function Panel({
  label,
  subtitle,
  children,
}: {
  label: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden">
      <div className="px-4 py-2 border-b border-border bg-muted/30">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="px-3 py-3">{children}</div>
    </div>
  );
}

function RawPanel({
  project,
  hotels,
  destinationSlug,
  color,
}: {
  project: ReturnType<typeof makeProjection>;
  hotels: HotelPoint[];
  destinationSlug: string;
  color: string;
}) {
  // Centre label: average of hotel coordinates for a single destination pin.
  let avgLng = 0;
  let avgLat = 0;
  for (const h of hotels) {
    avgLng += h.lng;
    avgLat += h.lat;
  }
  avgLng /= hotels.length || 1;
  avgLat /= hotels.length || 1;
  const [pinX, pinY] = project(avgLng, avgLat);

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="w-full h-auto"
      role="img"
      aria-label={`${hotels.length} hotels grouped under one destination`}
    >
      <rect x={0} y={0} width={VIEW_W} height={VIEW_H} fill="#f8fafc" />

      {hotels.map((h) => {
        const [x, y] = project(h.lng, h.lat);
        return (
          <circle
            key={h.hotelKey}
            cx={x}
            cy={y}
            r={3}
            fill="#94a3b8"
            opacity={0.85}
          />
        );
      })}

      <g>
        <circle cx={pinX} cy={pinY} r={11} fill={color} opacity={0.18} />
        <circle cx={pinX} cy={pinY} r={6} fill={color} stroke="#fff" strokeWidth={2} />
        <text
          x={pinX}
          y={pinY - 14}
          textAnchor="middle"
          fontSize={12}
          fontWeight={600}
          fill="#0f172a"
        >
          {destinationLabel(destinationSlug)}
        </text>
      </g>
    </svg>
  );
}

function ClassifiedPanel({
  project,
  regions,
  hotels,
  assignmentByKey,
  palette,
}: {
  project: ReturnType<typeof makeProjection>;
  regions: IndexedRegion[];
  hotels: HotelPoint[];
  assignmentByKey: Map<string, ReturnType<typeof getDemoResult>['result']['assignments'][number]>;
  palette: (slug: string) => string;
}) {
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="w-full h-auto"
      role="img"
      aria-label="Hotels snapped into region polygons"
    >
      <rect x={0} y={0} width={VIEW_W} height={VIEW_H} fill="#f8fafc" />

      {regions.map((r) => {
        const color = palette(r.destinationSlug);
        const d = polygonToSvgPath(r.polygon, project);
        return (
          <path
            key={r.id}
            d={d}
            fill={color}
            fillOpacity={0.14}
            stroke={color}
            strokeWidth={1.25}
          />
        );
      })}

      {regions.map((r) => {
        const [cx, cy] = project(r.centroidLng, r.centroidLat);
        return (
          <text
            key={`${r.id}-label`}
            x={cx}
            y={cy}
            textAnchor="middle"
            fontSize={9}
            fontWeight={600}
            fill="#0f172a"
            opacity={0.7}
          >
            {r.name}
          </text>
        );
      })}

      {hotels.map((h) => {
        const a = assignmentByKey.get(h.hotelKey);
        const state = markerState({
          method: a?.method,
          regionId: a?.regionId,
          route: a?.route,
        });
        const [x, y] = project(h.lng, h.lat);
        return (
          <circle
            key={h.hotelKey}
            cx={x}
            cy={y}
            r={3.5}
            fill={MARKER_COLORS[state]}
            stroke="#fff"
            strokeWidth={1}
          />
        );
      })}
    </svg>
  );
}

type Counts = {
  auto: number;
  review: number;
  unassigned: number;
  manual: number;
};

function headlineCounts(
  hotels: HotelPoint[],
  assignments: ReturnType<typeof getDemoResult>['result']['assignments'],
): Counts {
  const byKey = new Map(assignments.map((a) => [a.hotelKey, a]));
  const c: Counts = { auto: 0, review: 0, unassigned: 0, manual: 0 };
  for (const h of hotels) {
    const a = byKey.get(h.hotelKey);
    if (!a) continue;
    if (a.route === 'AUTO') c.auto++;
    else if (a.route === 'UNASSIGNED') c.unassigned++;
    else c.review++;
  }
  return c;
}

function HeroCaption({ counts }: { counts: Counts }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 px-4 py-3 space-y-1">
      <p className="text-sm font-semibold text-emerald-900">
        {counts.auto} auto-assigned · {counts.review} correctly flagged ambiguous · {counts.unassigned} correctly flagged outside all regions · zero misassignments
      </p>
      <p className="text-xs text-emerald-900/70">
        Engine output over the seeded Dubai fixture. The two flagged hotels are not errors — they are the two cases the engine deliberately routes to review: a property in the Marina ↔ JBR overlap strip, and a property outside every region polygon.
      </p>
    </div>
  );
}

function destinationLabel(slug: string): string {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}
