// Overpass JSON → validated, simplified RegionInput shape.
//
// Pure module. The script (scripts/osm-region-import.ts) wraps this with
// network + persistence; tests exercise this directly against captured
// fixtures so the conversion path stays covered without depending on
// Overpass.
//
// Pipeline per candidate region:
//   1. osmtogeojson(overpass) → FeatureCollection
//   2. pick polygon/multipolygon features whose name fuzzy-matches the
//      requested region name — return ALL matches so the operator
//      confirms (silent-wrong-write is the worst outcome, per the brief)
//   3. dissolve a feature's geometry into our canonical GeoPolygonOrMulti
//   4. turf.simplify with a tuneable tolerance + high-quality option off
//      so we get speed without spike-removal artefacts
//   5. validate against polygonOrMultiSchema (the same validator the admin
//      draw flow uses — reused, not re-implemented)

import osmtogeojson from 'osmtogeojson';
import simplify from '@turf/simplify';
import type { Feature, FeatureCollection, GeometryObject, MultiPolygon, Polygon } from 'geojson';
import type { GeoPolygonOrMulti } from '../types';
import { polygonOrMultiSchema } from '../service/regions-mutations';

export type OsmCandidate = {
  osmId: string | number | undefined;
  osmType: string | undefined;
  name: string;
  matchKind: 'exact' | 'contains' | 'fuzzy';
  geometry: GeoPolygonOrMulti;
  vertexCount: number;
};

export type ConvertOptions = {
  simplifyToleranceDeg?: number; // default 0.0005 (~55 m at the equator)
  highQuality?: boolean;         // default false (fast Douglas-Peucker)
};

export type ConvertResult = {
  candidates: OsmCandidate[];
  notes: string[];
};

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

function classifyMatch(haystack: string, needle: string): OsmCandidate['matchKind'] | null {
  const a = normalize(haystack);
  const b = normalize(needle);
  if (!a || !b) return null;
  if (a === b) return 'exact';
  if (a.includes(b) || b.includes(a)) return 'contains';
  // Token-overlap is enough of a signal — the operator still confirms.
  const aTokens = new Set(a.split(/\s+/).filter(Boolean));
  const bTokens = new Set(b.split(/\s+/).filter(Boolean));
  for (const t of bTokens) if (aTokens.has(t)) return 'fuzzy';
  return null;
}

function countVertices(geom: GeoPolygonOrMulti): number {
  if (geom.type === 'Polygon') {
    return geom.coordinates.reduce((n, ring) => n + ring.length, 0);
  }
  return geom.coordinates.reduce(
    (n, poly) => n + poly.reduce((m, ring) => m + ring.length, 0),
    0,
  );
}

function isPolygonGeometry(g: GeometryObject | null | undefined): g is Polygon | MultiPolygon {
  return !!g && (g.type === 'Polygon' || g.type === 'MultiPolygon');
}

function geometryToOurs(g: Polygon | MultiPolygon): GeoPolygonOrMulti {
  // Both shapes already use [lng, lat] in GeoJSON; our types use the same
  // order. The cast is structural — Position is `number[]` in @types/geojson
  // but we constrain to [number, number] via our zod validator below.
  return g as GeoPolygonOrMulti;
}

export function convertOverpass(
  overpass: unknown,
  requestedName: string,
  options: ConvertOptions = {},
): ConvertResult {
  const tolerance = options.simplifyToleranceDeg ?? 0.0005;
  const highQuality = options.highQuality ?? false;

  const fc = osmtogeojson(overpass) as FeatureCollection<GeometryObject>;
  const candidates: OsmCandidate[] = [];
  const notes: string[] = [];

  for (const f of fc.features) {
    const feature = f as Feature<GeometryObject, Record<string, unknown>>;
    if (!isPolygonGeometry(feature.geometry)) continue;
    const props = (feature.properties ?? {}) as Record<string, unknown>;
    const featureName = typeof props.name === 'string' ? props.name : '';
    if (!featureName) continue;
    const kind = classifyMatch(featureName, requestedName);
    if (!kind) continue;

    // Simplify in place is dangerous on the source FC, so clone the
    // geometry before passing it through turf. mutate:false also works
    // but cloning makes the resulting shape easier to reason about.
    const clone = JSON.parse(JSON.stringify(feature)) as Feature<Polygon | MultiPolygon>;
    const simplified = simplify(clone, { tolerance, highQuality, mutate: true });
    const ours = geometryToOurs(simplified.geometry as Polygon | MultiPolygon);

    // Final guard: the read/write validator (Phase 2) is the source of
    // truth for "is this a valid region geometry". Drop anything that
    // fails. This is also the test hook — invalid geometries never reach
    // the candidate list.
    const validated = polygonOrMultiSchema.safeParse(ours);
    if (!validated.success) {
      notes.push(
        `${featureName}: dropped — geometry failed schema validation (${validated.error.issues[0]?.message ?? 'unknown'})`,
      );
      continue;
    }

    const osmId =
      typeof props.id === 'string' || typeof props.id === 'number'
        ? props.id
        : undefined;
    const osmType =
      typeof props['@type'] === 'string'
        ? (props['@type'] as string)
        : typeof props.type === 'string'
          ? (props.type as string)
          : undefined;

    candidates.push({
      osmId,
      osmType,
      name: featureName,
      matchKind: kind,
      geometry: validated.data,
      vertexCount: countVertices(validated.data),
    });
  }

  if (candidates.length === 0) {
    notes.push(`no boundary for ${requestedName} → stays hand-drawn`);
  }

  return { candidates, notes };
}

// Provenance gate — never overwrite operator-edited (MANUAL) regions.
// Pure function so the script and tests share the same rule.
export type ApplyDecision =
  | { apply: true; reason: 'no-existing' | 'overwrite-seed' | 'refresh-osm' }
  | { apply: false; reason: 'manual-protected' };

export function shouldApply(existingSource: 'SEED' | 'OSM' | 'MANUAL' | undefined): ApplyDecision {
  if (existingSource === undefined) return { apply: true, reason: 'no-existing' };
  if (existingSource === 'MANUAL') return { apply: false, reason: 'manual-protected' };
  if (existingSource === 'SEED') return { apply: true, reason: 'overwrite-seed' };
  return { apply: true, reason: 'refresh-osm' };
}
