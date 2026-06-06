// Overpass HTTP client + query builder.
//
// The sandbox has no network access to Overpass — this module is run
// manually via scripts/osm-region-import.ts against a live Overpass
// instance. Tests exercise the pure conversion path (overpass-to-region)
// using captured fixtures.
//
// Usage policy reminder (also in scripts/osm-region-import.ts header):
// the public Overpass instance throttles aggressive clients. Run with
// rate limits, cache responses, and do not hammer.

export type OverpassBbox = {
  // Overpass query syntax uses (south, west, north, east).
  // Stored bboxes elsewhere in this module are [minLng, minLat, maxLng,
  // maxLat]. The conversion lives here only — call sites pass our
  // canonical bbox and we shuffle the axes inside.
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

export type OverpassClientOptions = {
  endpoint?: string;       // default https://overpass-api.de/api/interpreter
  timeoutSeconds?: number; // server-side Overpass timeout, default 60
  userAgent?: string;
};

const DEFAULT_ENDPOINT = 'https://overpass-api.de/api/interpreter';

export function buildBoundaryQuery(name: string, bbox: OverpassBbox, timeout = 60): string {
  // Overpass QL bbox order is (south, west, north, east) = (lat_min,
  // lng_min, lat_max, lng_max).
  const southWestNorthEast = `${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng}`;
  // Escape regex specials and quotes in the name — Overpass interprets
  // the value as a regex on the right of `~`.
  const safeName = name.replace(/["\\]/g, '\\$&').replace(/[.*+?^${}()|[\]]/g, '\\$&');
  return [
    `[out:json][timeout:${timeout}];`,
    `(`,
    `  relation["boundary"="administrative"]["name"~"${safeName}",i](${southWestNorthEast});`,
    `  relation["place"]["name"~"${safeName}",i](${southWestNorthEast});`,
    `);`,
    `out geom;`,
  ].join('\n');
}

export async function fetchOverpass(
  query: string,
  options: OverpassClientOptions = {},
): Promise<unknown> {
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  const userAgent =
    options.userAgent ?? 'hotelmappingtool-region-import/1.0 (contact: ops@hotelmappingtool.com)';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'user-agent': userAgent,
    },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Overpass HTTP ${res.status}: ${text.slice(0, 500)}`);
  }
  return res.json();
}
