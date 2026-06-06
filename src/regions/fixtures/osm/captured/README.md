# Captured Overpass output

Written by [`scripts/osm-region-import.ts`](../../../../../scripts/osm-region-import.ts).

For each region slug the script writes two files:

- `<slug>.overpass.json` — the raw Overpass response (cached so the next
  run does not re-hammer the public endpoint).
- `<slug>.geojson` — the chosen, simplified, validated boundary in our
  canonical `[lng, lat]` `GeoPolygon` / `GeoMultiPolygon` shape.

The script's default mode writes to this directory and does **not**
touch the database. Pass `--apply` (and the `react-server` Node
condition) to also upsert the region row with `source=OSM`. Manual
(`source=MANUAL`) rows are protected by `shouldApply()` and are skipped.

Overpass usage policy
---------------------

The public Overpass instance throttles aggressive clients. Run with
modest concurrency, reuse the captured `.overpass.json` files between
iterations, and set a meaningful `User-Agent` (the client does this
already; override via the `OVERPASS_URL` env var if you have a
private instance).
