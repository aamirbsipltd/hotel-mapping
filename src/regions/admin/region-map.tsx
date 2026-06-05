'use client';

// Region admin map — client-only.
//
// Loaded from the workbench page via `next/dynamic` with `{ ssr: false }`
// because Leaflet and leaflet-draw both touch `window` at module top.
//
// Coordinate-order discipline:
//   • Region polygons go in via L.geoJSON() — Leaflet reads [lng, lat]
//     from GeoJSON and converts internally. No hand-flipping here.
//   • Hotel markers use L.circleMarker([lat, lng]) — Leaflet's native
//     order. Hotels in the DB store {lat, lng} already.
//   • Drawn polygons are read back via layer.toGeoJSON() which produces
//     the [lng, lat] shape we persist. We never flip by hand.
//
// OSM attribution is left visible (the Leaflet attribution control is on
// by default and the tile layer sets the OSM credit string). Required by
// OSM's tile-usage policy and the brief's compliance rule.

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

import { useEffect, useRef, useState } from 'react';
import type L from 'leaflet';
import type { DbRegion } from '../service/store';
import type { HotelPoint, GeoPolygonOrMulti } from '../types';
import { MARKER_COLORS, destinationColor, markerState } from './colors';

export type RegionMapAssignment = {
  hotelKey: string;
  regionId: string | null;
  method: 'AUTO' | 'MANUAL' | 'UNASSIGNED';
  isOverride: boolean;
};

export type RegionMapProps = {
  regions: DbRegion[];
  hotels: HotelPoint[];
  assignments: RegionMapAssignment[];
  destinationSlugs: string[];
  selectedHotelKey?: string | null;
  onHotelClick?: (h: HotelPoint) => void;
  onPolygonDrawn?: (geo: GeoPolygonOrMulti) => void;
};

type LeafletNS = typeof import('leaflet');

export default function RegionMap({
  regions,
  hotels,
  assignments,
  destinationSlugs,
  selectedHotelKey,
  onHotelClick,
  onPolygonDrawn,
}: RegionMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const regionLayerRef = useRef<L.LayerGroup | null>(null);
  const hotelLayerRef = useRef<L.LayerGroup | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const hasFitRef = useRef(false);
  const [ready, setReady] = useState(false);

  // ── Map init (run once) ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const node = containerRef.current;
    if (!node) return;

    (async () => {
      const Lns = (await import('leaflet')) as unknown as LeafletNS;
      await import('leaflet-draw');
      if (cancelled || !node) return;
      const L = Lns;

      const map = L.map(node, {
        center: [30, 30],
        zoom: 3,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const regionLayer = L.layerGroup().addTo(map);
      const hotelLayer = L.layerGroup().addTo(map);
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);

      const DrawCtor = (L.Control as unknown as {
        Draw: new (opts: unknown) => L.Control;
      }).Draw;
      const drawControl = new DrawCtor({
        position: 'topright',
        draw: {
          polyline: false,
          marker: false,
          circle: false,
          circlemarker: false,
          rectangle: false,
          polygon: {
            allowIntersection: false,
            showArea: true,
            shapeOptions: { color: '#059669', weight: 2 },
          },
        },
        edit: { featureGroup: drawnItems, edit: false, remove: false },
      });
      map.addControl(drawControl);

      mapRef.current = map;
      regionLayerRef.current = regionLayer;
      hotelLayerRef.current = hotelLayer;
      drawnItemsRef.current = drawnItems;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      regionLayerRef.current = null;
      hotelLayerRef.current = null;
      drawnItemsRef.current = null;
    };
  }, []);

  // Bind the draw:created handler each time the polygon-drawn callback
  // changes. Rebinding (not stashing the callback in a ref) keeps the
  // handler closure pointing at the latest prop without violating React
  // 19's "no mutating refs in effects" rule.
  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    const drawnItems = drawnItemsRef.current;
    if (!map || !drawnItems) return;
    type DrawCreatedEvent = { layer: L.Polygon };
    const handler = (e: unknown) => {
      const layer = (e as DrawCreatedEvent).layer;
      drawnItems.addLayer(layer);
      const feature = layer.toGeoJSON();
      const geom = (feature as unknown as { geometry: GeoPolygonOrMulti }).geometry;
      onPolygonDrawn?.(geom);
    };
    map.on('draw:created', handler);
    return () => {
      map.off('draw:created', handler);
    };
  }, [ready, onPolygonDrawn]);

  // ── Render regions ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    const layer = regionLayerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')) as unknown as LeafletNS;
      if (cancelled) return;
      layer.clearLayers();
      const bboxes: L.LatLngBounds[] = [];
      for (const r of regions) {
        const color = destinationColor(r.destinationSlug, destinationSlugs);
        const gj = L.geoJSON(r.polygon as unknown as GeoJSON.GeometryObject, {
          style: {
            color,
            weight: 2,
            fillColor: color,
            fillOpacity: 0.12,
          },
        });
        gj.bindTooltip(`${r.name} · ${r.destinationName}`, { sticky: true });
        gj.addTo(layer);
        const b = gj.getBounds();
        if (b.isValid()) bboxes.push(b);
      }
      if (!hasFitRef.current && bboxes.length > 0) {
        const merged = bboxes.reduce<L.LatLngBounds | null>((acc, b) =>
          acc ? acc.extend(b) : L.latLngBounds(b.getSouthWest(), b.getNorthEast()),
        null);
        if (merged) map.fitBounds(merged, { padding: [24, 24] });
        hasFitRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [regions, destinationSlugs, ready]);

  // ── Render hotels ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    const layer = hotelLayerRef.current;
    if (!layer) return;
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')) as unknown as LeafletNS;
      if (cancelled) return;
      layer.clearLayers();
      const byKey = new Map(assignments.map((a) => [a.hotelKey, a]));
      for (const h of hotels) {
        const a = byKey.get(h.hotelKey);
        const state = markerState({
          method: a?.method,
          isOverride: a?.isOverride,
          regionId: a?.regionId,
        });
        const color = MARKER_COLORS[state];
        const isSelected = h.hotelKey === selectedHotelKey;
        const marker = L.circleMarker([h.lat, h.lng], {
          radius: isSelected ? 8 : 5,
          color: isSelected ? '#0f172a' : color,
          weight: isSelected ? 2 : 1,
          fillColor: color,
          fillOpacity: 0.9,
        });
        marker.bindTooltip(`${h.name} · ${h.hotelKey}`);
        marker.on('click', () => onHotelClick?.(h));
        marker.addTo(layer);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hotels, assignments, selectedHotelKey, onHotelClick, ready]);

  return (
    <div
      ref={containerRef}
      className="h-[640px] w-full rounded-lg border border-border overflow-hidden"
    />
  );
}
