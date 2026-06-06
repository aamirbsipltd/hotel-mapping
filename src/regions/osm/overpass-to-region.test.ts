import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { convertOverpass, shouldApply } from './overpass-to-region';
import { computeBbox, computeCentroid } from '../geo/coords';
import { buildRegionIndex, assign } from '../assign';
import type { GeoMultiPolygon } from '../types';

// Hand-authored Overpass JSON. Small enough to read; two relations, one
// matching "Alcúdia" with a MultiPolygon (island-like, two outer rings),
// one matching "Pollença" alongside it. This mirrors the real Mallorca
// case where two adjacent municipalities come back in a single Overpass
// query.
const OVERPASS_FIXTURE = {
  version: 0.6,
  generator: 'Overpass API (test fixture)',
  elements: [
    {
      type: 'relation',
      id: 1001,
      tags: {
        boundary: 'administrative',
        type: 'multipolygon',
        name: 'Alcúdia',
        admin_level: '8',
      },
      members: [
        {
          type: 'way',
          ref: 2001,
          role: 'outer',
          geometry: [
            { lat: 39.840, lon: 3.105 },
            { lat: 39.870, lon: 3.105 },
            { lat: 39.870, lon: 3.140 },
            { lat: 39.840, lon: 3.140 },
            { lat: 39.840, lon: 3.105 },
          ],
        },
        {
          // Second outer — a tiny offshore islet (forces MultiPolygon).
          type: 'way',
          ref: 2002,
          role: 'outer',
          geometry: [
            { lat: 39.880, lon: 3.150 },
            { lat: 39.885, lon: 3.150 },
            { lat: 39.885, lon: 3.155 },
            { lat: 39.880, lon: 3.155 },
            { lat: 39.880, lon: 3.150 },
          ],
        },
      ],
    },
    {
      type: 'relation',
      id: 1002,
      tags: {
        boundary: 'administrative',
        type: 'multipolygon',
        name: 'Pollença',
        admin_level: '8',
      },
      members: [
        {
          type: 'way',
          ref: 2003,
          role: 'outer',
          geometry: [
            { lat: 39.870, lon: 3.020 },
            { lat: 39.900, lon: 3.020 },
            { lat: 39.900, lon: 3.090 },
            { lat: 39.870, lon: 3.090 },
            { lat: 39.870, lon: 3.020 },
          ],
        },
      ],
    },
  ],
};

describe('convertOverpass', () => {
  test('matches by name and returns simplified, validated geometries', () => {
    const result = convertOverpass(OVERPASS_FIXTURE, 'Alcúdia');
    assert.equal(result.candidates.length, 1, `expected 1 candidate, got ${result.candidates.length}`);
    const candidate = result.candidates[0];
    assert.equal(candidate.matchKind, 'exact');
    assert.equal(candidate.name, 'Alcúdia');
    assert.ok(['Polygon', 'MultiPolygon'].includes(candidate.geometry.type));
    assert.ok(candidate.vertexCount >= 4);
  });

  test('logs and skips when no name matches — never blind-writes', () => {
    const result = convertOverpass(OVERPASS_FIXTURE, 'Cala Llombards');
    assert.equal(result.candidates.length, 0);
    assert.ok(
      result.notes.some((n) => n.includes('no boundary for Cala Llombards')),
      `notes: ${result.notes.join(' | ')}`,
    );
  });

  test('downstream coords math handles the OSM MultiPolygon end-to-end', () => {
    // Hand-author a MultiPolygon directly to remove osmtogeojson out of
    // the loop and prove the math itself is multi-polygon-safe.
    const multi: GeoMultiPolygon = {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [3.105, 39.840],
            [3.140, 39.840],
            [3.140, 39.870],
            [3.105, 39.870],
            [3.105, 39.840],
          ],
        ],
        [
          [
            [3.150, 39.880],
            [3.155, 39.880],
            [3.155, 39.885],
            [3.150, 39.885],
            [3.150, 39.880],
          ],
        ],
      ],
    };

    const bbox = computeBbox(multi);
    assert.equal(bbox[0], 3.105);
    assert.equal(bbox[1], 39.840);
    assert.equal(bbox[2], 3.155);
    assert.equal(bbox[3], 39.885);

    const centroid = computeCentroid(multi);
    assert.ok(centroid.lat > 39.84 && centroid.lat < 39.89);
    assert.ok(centroid.lng > 3.10 && centroid.lng < 3.16);

    // Engine: point-in-polygon must handle the multi-ring shape.
    const index = buildRegionIndex([
      {
        id: 'alcudia-multi',
        slug: 'alcudia-multi',
        name: 'Alcúdia (multi)',
        destinationSlug: 'mallorca',
        polygon: multi,
      },
    ]);
    // Point inside the main outer ring → AUTO.
    const insideMain = assign(
      { hotelKey: 'X-MAIN', name: 'Main', lat: 39.855, lng: 3.122 },
      index,
    );
    assert.equal(insideMain.route, 'AUTO');
    assert.equal(insideMain.regionId, 'alcudia-multi');
    // Point inside the second outer ring (the islet) → AUTO too.
    const insideIslet = assign(
      { hotelKey: 'X-ISLET', name: 'Islet', lat: 39.882, lng: 3.152 },
      index,
    );
    assert.equal(insideIslet.route, 'AUTO');
    assert.equal(insideIslet.regionId, 'alcudia-multi');
    // Point in the gap between → not AUTO.
    const inBetween = assign(
      { hotelKey: 'X-GAP', name: 'Gap', lat: 39.872, lng: 3.148 },
      index,
    );
    assert.notEqual(inBetween.route, 'AUTO');
  });
});

describe('shouldApply — provenance gate', () => {
  test('writes when no row exists', () => {
    const d = shouldApply(undefined);
    assert.equal(d.apply, true);
    if (d.apply) assert.equal(d.reason, 'no-existing');
  });

  test('refreshes seed rows', () => {
    const d = shouldApply('SEED');
    assert.equal(d.apply, true);
    if (d.apply) assert.equal(d.reason, 'overwrite-seed');
  });

  test('re-imports prior OSM rows', () => {
    const d = shouldApply('OSM');
    assert.equal(d.apply, true);
    if (d.apply) assert.equal(d.reason, 'refresh-osm');
  });

  test('NEVER overwrites MANUAL rows', () => {
    const d = shouldApply('MANUAL');
    assert.equal(d.apply, false);
    if (!d.apply) assert.equal(d.reason, 'manual-protected');
  });
});
