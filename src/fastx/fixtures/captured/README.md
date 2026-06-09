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

---

## Travelgate live-sandbox captures (Phase 0 connect)

Two captures landed against `https://api.travelgate.com`, access `34538`
(FastX master), using the patched query (cardTypes as scalar list,
descriptions.texts nested, Language passed as quoted strings):

- `ES284122.json` — *Hotel Test* — master record, no amenities.
- `BR1518.json` — *NORD EASY PATOS* — master record, no amenities.

Both are master-only by the brief's §1 ("the FastX context currently
returns only master fields — hotel code, name, country, address,
lat/long, GIATA ID. It does not return rich amenities, descriptions, or
images.") — so they prove the end-to-end live connection but cannot
exercise the amenities classifier.

**Open item:** the Seller accesses recommended for amenities — `2`
(`HOTELTEST`) and `5647` (`LOGITEST`) — both returned `hotelData: null`
with the sandbox credentials in `.env`. Auth, query, and headers
(`Authorization: Apikey`, `tgx-client`, `tgx-context`) all succeed; the
server simply returns a null record from those accesses. Likely causes:
the test credentials in the brief may not grant access to those Sellers
in this sandbox, or an additional `settings` field is required.

To unblock the amenities capture, re-run with credentials that the
target Sellers recognise:

```
TRAVELGATE_ACCESS_ID=2 TRAVELGATE_CONTEXT=HOTELTEST \
  npx tsx scripts/fastx-probe.ts ES284122 BR1518
```

Output should write `ES284122.json` / `BR1518.json` with non-null
`allAmenities.edges` and a populated `cardTypes` list.
