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

export const HOTELX_GRAPHQL_URL =
  process.env.TRAVELGATE_GRAPHQL_URL ?? 'https://api.travelgatex.com/';

export type HotelXAuth = {
  apiKey: string;
  accessId: string;
};

export function buildAuthHeaders(apiKey: string): HeadersInit {
  // HotelX accepts the API key as "Authorization: Apikey <key>" in current
  // production and sandbox. The probe and live adapter both use this exact
  // header — if Travelgate ever changes the auth scheme, fix it here only.
  return {
    'Content-Type': 'application/json',
    Authorization: `Apikey ${apiKey}`,
  };
}

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
              cardTypes {
                code
              }
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
              descriptions(languages: [EN, DE]) {
                type
                text
                language
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

export function buildHotelContentVariables(
  auth: HotelXAuth,
  hotelCodes: string[],
): HotelContentVariables {
  return {
    criteria: {
      access: auth.accessId,
      hotelCodes,
      maxSize: hotelCodes.length,
    },
  };
}
