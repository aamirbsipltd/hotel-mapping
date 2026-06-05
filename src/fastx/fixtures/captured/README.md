# Captured HotelData

Real HotelX content responses written by [`scripts/fastx-probe.ts`](../../../../scripts/fastx-probe.ts).

Run the probe with sandbox credentials in `.env`:

```
tsx scripts/fastx-probe.ts <hotelCode> [<hotelCode> ...]
```

Each capture lands here as `<hotelCode>.json` — the full `hotelData` slice
returned by the `HotelContent` query. These are the source of truth that
hand-authored fixtures in `src/fastx/fixtures/` derive from once the
sandbox key is available.

Notes:

- Sandbox sellers may return thin or synthetic content. Connection + schema
  shape is what matters here, not richness.
- `mappings[context="GIATA"]` is typically empty without a separate GIATA
  Multicodes commercial agreement — expected, not an error.
- Captures may be regenerated at any time; commit them so the fixtures'
  provenance is auditable.
