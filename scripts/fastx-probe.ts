// Travelgate HotelX sandbox probe.
//
// Standalone — runs outside the Next app via `tsx scripts/fastx-probe.ts`.
//
// Usage:
//   tsx scripts/fastx-probe.ts <hotelCode> [<hotelCode> ...]
//
// Requires (in .env or the calling shell):
//   TRAVELGATE_API_KEY   — Travelgate buyer Apikey (sandbox or production)
//   TRAVELGATE_ACCESS_ID — seller access ID (sandbox test-seller works)
// Optional:
//   TRAVELGATE_GRAPHQL_URL — endpoint override (defaults to api.travelgatex.com)
//
// On success: writes each HotelData JSON to src/fastx/fixtures/captured/<code>.json
// and prints a one-line summary per hotel (# amenities, has cardTypes,
// has GIATA mapping).
//
// Caveats (per brief §−1):
//  • Sandbox sellers may return thin/synthetic content — the connection
//    and schema shape is what matters here, not richness.
//  • mappings[context="GIATA"] is typically empty without a separate
//    GIATA Multicodes commercial agreement — expected, ignore.
//  • If captured content is sparse, hand-authored fixtures (§8) stay in
//    place; flag any augmentation in the fixture file's comment header.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  HOTELX_GRAPHQL_URL,
  HOTEL_CONTENT_QUERY,
  buildAuthHeaders,
  buildHotelContentVariables,
} from '../src/fastx/source/hotelx-query';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..');
const CAPTURED_DIR = resolve(REPO_ROOT, 'src/fastx/fixtures/captured');

function loadDotEnv(): void {
  // Minimal .env loader so the probe runs without Next's loader.
  const path = resolve(REPO_ROOT, '.env');
  if (!existsSync(path)) return;
  const text = readFileSync(path, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function usage(): void {
  console.log(
    [
      'Travelgate HotelX probe',
      '',
      'Usage:',
      '  tsx scripts/fastx-probe.ts <hotelCode> [<hotelCode> ...]',
      '',
      'Environment:',
      '  TRAVELGATE_API_KEY    Travelgate buyer Apikey (required)',
      '  TRAVELGATE_ACCESS_ID  seller access ID, sandbox test-seller works (required)',
      '  TRAVELGATE_GRAPHQL_URL endpoint override (default: https://api.travelgatex.com/)',
      '',
      'How to get sandbox credentials:',
      '  1. Register a buyer account at https://www.travelgatex.com/',
      '  2. Request sandbox API access — does not require a commercial agreement',
      '  3. The dashboard exposes an Apikey and one or more test-seller access IDs',
      '',
      'Output:',
      '  src/fastx/fixtures/captured/<hotelCode>.json',
    ].join('\n'),
  );
}

type GraphQLResponse = {
  data?: {
    hotelX?: {
      hotels?: {
        edges?: Array<{ node?: { hotelData?: Record<string, unknown> } }>;
      };
    };
  };
  errors?: Array<{ message: string; path?: string[] }>;
};

async function fetchHotels(
  apiKey: string,
  accessId: string,
  hotelCodes: string[],
): Promise<GraphQLResponse> {
  const res = await fetch(HOTELX_GRAPHQL_URL, {
    method: 'POST',
    headers: buildAuthHeaders(apiKey),
    body: JSON.stringify({
      query: HOTEL_CONTENT_QUERY,
      variables: buildHotelContentVariables({ apiKey, accessId }, hotelCodes),
    }),
  });
  const text = await res.text();
  let parsed: GraphQLResponse;
  try {
    parsed = JSON.parse(text) as GraphQLResponse;
  } catch {
    throw new Error(`Non-JSON response from HotelX (HTTP ${res.status}): ${text.slice(0, 500)}`);
  }
  if (!res.ok && !parsed.errors) {
    throw new Error(`HotelX returned HTTP ${res.status}: ${text.slice(0, 500)}`);
  }
  return parsed;
}

function summarise(hotelData: Record<string, unknown>): string {
  const code = String(hotelData.hotelCode ?? '?');
  const name = String(hotelData.hotelName ?? '');
  const amenities = (
    (hotelData.allAmenities as { edges?: unknown[] } | undefined)?.edges ?? []
  ).length;
  const cardCount = Array.isArray(hotelData.cardTypes) ? hotelData.cardTypes.length : 0;
  const mappings = Array.isArray(hotelData.mappings)
    ? (hotelData.mappings as Array<{ context?: string }>)
    : [];
  const hasGiata = mappings.some((m) => m.context === 'GIATA');
  return `${code} (${name || '—'}): amenities=${amenities} cardTypes=${cardCount} giata=${hasGiata ? 'yes' : 'no'}`;
}

async function main() {
  loadDotEnv();

  const codes = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    usage();
    return;
  }
  if (codes.length === 0) {
    usage();
    process.exitCode = 1;
    return;
  }

  const apiKey = process.env.TRAVELGATE_API_KEY;
  const accessId = process.env.TRAVELGATE_ACCESS_ID;

  if (!apiKey || !accessId) {
    console.log('TRAVELGATE_API_KEY or TRAVELGATE_ACCESS_ID is not set.');
    console.log('Skipping live probe — see usage for how to obtain sandbox credentials.');
    console.log('Hand-authored fixtures remain in place until the key arrives.');
    usage();
    return;
  }

  console.log(`Querying ${HOTELX_GRAPHQL_URL} for ${codes.length} hotel code(s)…`);

  let res: GraphQLResponse;
  try {
    res = await fetchHotels(apiKey, accessId, codes);
  } catch (err) {
    console.error('Probe failed:', err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
    return;
  }

  if (res.errors?.length) {
    console.error('HotelX returned GraphQL errors:');
    for (const e of res.errors) {
      console.error(`  • ${e.message}${e.path ? ` [${e.path.join('.')}]` : ''}`);
    }
    process.exitCode = 1;
    return;
  }

  const edges = res.data?.hotelX?.hotels?.edges ?? [];
  if (edges.length === 0) {
    console.log('No hotel edges returned. The test seller may not list those codes.');
    return;
  }

  mkdirSync(CAPTURED_DIR, { recursive: true });

  for (const edge of edges) {
    const hotelData = edge?.node?.hotelData;
    if (!hotelData) continue;
    const code = String(hotelData.hotelCode ?? 'unknown');
    const safe = code.replace(/[^A-Za-z0-9_.-]+/g, '_');
    const outPath = resolve(CAPTURED_DIR, `${safe}.json`);
    writeFileSync(outPath, JSON.stringify(hotelData, null, 2));
    console.log(summarise(hotelData));
    console.log(`  → wrote ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
