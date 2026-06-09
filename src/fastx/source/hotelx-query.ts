// Shared HotelX GraphQL bindings.
//
// Phase −1 (scripts/fastx-probe.ts) and Phase 4 (LiveFastXSource) import the
// query string, endpoint, and auth header builder from this module so they
// cannot drift. The query mirrors the shape in the implementation brief
// §3/§9: hotelData with hotelCode/Name, categoryCode, giataData, cardTypes,
// allAmenities edges, descriptions, and external mappings.
//
// The HotelX content query lives under `hotelX.hotels(criteria, relay, token)`
// and takes a `HotelXHotelListInput` carrying the seller access ID and the
// list of hotelCodes. The access ID identifies the test-seller integration
// (each Travelgate buyer is wired up to one or more sellers); it is required
// alongside the API key.

// Single Travelgate gateway for both sandbox and production. Phase 0 of
// the live-sandbox connect confirmed this URL via Laura's example; the
// older `api.travelgatex.com/` host is no longer the canonical endpoint.
export const HOTELX_GRAPHQL_URL =
  process.env.TRAVELGATE_GRAPHQL_URL ?? 'https://api.travelgate.com';

export type HotelXAuth = {
  apiKey: string;
  accessId: string;
  // Per the live-sandbox Phase 0 connect: the HotelX criteria requires
  // `client` and `context` alongside `access`. The seller table from
  // Travelgate is:
  //   • Travelgate test supplier — access 2, context HOTELTEST
  //   • Smyrooms test supplier   — access 5647, context LOGITEST
  //   • FastX master (static)    — access 34538, no amenities
  // `client` is the buyer's client identifier (the brief: `client_demo`).
  client?: string;
  context?: string;
};

export function buildAuthHeaders(
  apiKey: string,
  options: { client?: string; context?: string } = {},
): HeadersInit {
  // HotelX accepts the API key as "Authorization: Apikey <key>" in current
  // production and sandbox. The seller `client` and `context` are passed
  // via Travelgate's custom headers (verified live in Phase 0: they are
  // NOT fields on HotelXHotelListInput). If Travelgate ever changes the
  // auth scheme, fix it here only.
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Apikey ${apiKey}`,
  };
  if (options.client) headers['tgx-client'] = options.client;
  if (options.context) headers['tgx-context'] = options.context;
  return headers;
}

// Verified against the live Travelgate HotelX schema (Phase 0 capture):
//   • `cardTypes` is a list of enum/scalar values — no sub-selection allowed
//     (live errored: "[PaymentCardType!] has no subfields"). Treat the
//     element as the card-type code itself; the internal type carries it
//     as { code: string } and the live mapping normalises that.
//   • `descriptions` element wraps its text+language in a nested `texts`
//     list (live errored: "Cannot query field 'text' on type
//     'Description'"). The shape is `{ type, texts { text, language } }`.
// The deeper internal-type reconciliation (hotelx-types.ts updates +
// triage adapter) is Phase 1; this query is the minimum that lands a
// real capture so Phase 0 can ship.
export const HOTEL_CONTENT_QUERY = /* GraphQL */ `
  query HotelContent($criteria: HotelXHotelListInput!) {
    hotelX {
      hotels(criteria: $criteria) {
        edges {
          node {
            hotelData {
              hotelCode
              hotelName
              categoryCode
              giataData {
                id
                source
                href
              }
              cardTypes
              allAmenities(mapOptions: []) {
                edges {
                  node {
                    amenityData {
                      code
                      amenityCode
                      type
                      texts {
                        text
                        language
                      }
                      value {
                        text
                        language
                      }
                      mappings {
                        context
                        code
                      }
                    }
                  }
                }
              }
              descriptions(languages: ["EN", "DE"]) {
                type
                texts {
                  text
                  language
                }
              }
              mappings(contexts: ["TGX", "GIATA"]) {
                context
                code
              }
            }
          }
        }
      }
    }
  }
`;

export type HotelContentVariables = {
  criteria: {
    access: string;
    hotelCodes: string[];
    language?: string;
    maxSize?: number;
  };
};

// `client` and `context` from `auth` are NOT fields of
// HotelXHotelListInput (verified live in Phase 0 — the server returned
// "Field 'client' is not defined by type 'HotelXHotelListInput'"). They
// flow through buildAuthHeaders() as Travelgate's custom headers
// (`tgx-client`, `tgx-context`).
export function buildHotelContentVariables(
  auth: HotelXAuth,
  hotelCodes: string[],
): HotelContentVariables {
  void auth.client;
  void auth.context;
  return {
    criteria: {
      access: auth.accessId,
      hotelCodes,
      maxSize: hotelCodes.length,
    },
  };
}
