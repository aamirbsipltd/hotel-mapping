// rbush-backed spatial index over region bounding boxes.
//
// The index prunes the candidate set per hotel before the exact
// point-in-polygon test. For a tens-of-thousands hotel inventory against a
// few hundred regions the bbox prune drops the per-hotel turf work from
// O(R) to O(log R + k) where k is the small number of bbox candidates.
//
// rbush BBox uses {minX, minY, maxX, maxY}. We map X = longitude,
// Y = latitude (the GeoJSON convention) — keep that mapping consistent
// throughout this module so points and rectangles never cross axes.

import RBush, { type BBox as RBushBBox } from 'rbush';
import area from '@turf/area';
import type { RegionInput, IndexedRegion } from './types';
import { computeBbox, computeCentroid } from '../geo/coords';

type IndexEntry = RBushBBox & { region: IndexedRegion };

export class RegionIndex {
  readonly regions: IndexedRegion[];
  private readonly tree: RBush<IndexEntry>;

  constructor(regions: IndexedRegion[]) {
    this.regions = regions;
    this.tree = new RBush<IndexEntry>();
    this.tree.load(
      regions.map((r) => ({
        minX: r.minLng,
        minY: r.minLat,
        maxX: r.maxLng,
        maxY: r.maxLat,
        region: r,
      })),
    );
  }

  // Bbox candidates whose stored rectangle contains the point.
  candidatesAt(lng: number, lat: number): IndexedRegion[] {
    return this.tree
      .search({ minX: lng, minY: lat, maxX: lng, maxY: lat })
      .map((entry) => entry.region);
  }
}

export function indexRegion(input: RegionInput): IndexedRegion {
  const [minLng, minLat, maxLng, maxLat] = computeBbox(input.polygon);
  const centroid = computeCentroid(input.polygon);
  // turf.area accepts a geometry directly and returns square metres on the
  // WGS-84 spheroid — used for the smallest-area suggestion when polygons
  // overlap.
  const areaSqM = area(input.polygon);
  return {
    ...input,
    minLng,
    minLat,
    maxLng,
    maxLat,
    centroidLat: centroid.lat,
    centroidLng: centroid.lng,
    areaSqM,
  };
}

export function buildRegionIndex(inputs: RegionInput[]): RegionIndex {
  return new RegionIndex(inputs.map(indexRegion));
}
