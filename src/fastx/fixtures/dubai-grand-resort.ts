// Fixture A — the headline demo.
// Reproduces the feriendeals mess: genuine amenities across most categories,
// payment cardTypes leaking in, Dubai landmark strings in POI descriptions,
// and a couple of junk metadata tokens. Each amenity carries EN + DE text
// so the OTA-style output can switch languages without round-tripping
// through a translation table at runtime.

import type { HotelData } from '../hotelx-types';

export const dubaiHotel: HotelData = {
  hotelCode: 'TGX-DXB-1001',
  hotelName: 'Grand Dubai Marina Resort',
  categoryCode: '5EST',
  giataData: {
    id: '702145',
    source: 'GIATA',
    href: 'https://giatadrive.com/properties/702145',
  },
  mappings: [
    { context: 'TGX', code: 'TGX-DXB-1001' },
    { context: 'GIATA', code: '702145' },
  ],
  cardTypes: [
    { code: 'VI' },
    { code: 'MC' },
    { code: 'AX' },
    { code: 'MAESTRO' },
  ],
  descriptions: [
    {
      type: 'GENERAL',
      language: 'EN',
      text: 'Beachfront resort on Dubai Marina with five restaurants, two pools, full-service spa, and a kids club. Walking distance to Dubai Mall, the Burj Khalifa, and the Dubai Fountain show.',
    },
    {
      type: 'POI',
      language: 'EN',
      text: 'Dubai Mall — 1.2 km. Burj Khalifa — 1.5 km. Dubai Fountain — 1.3 km. Jumeirah Beach — 4.0 km.',
    },
  ],
  allAmenities: {
    edges: [
      // — Internet —
      {
        node: {
          amenityData: {
            code: 'WIFI_FREE',
            amenityCode: 'WIFI',
            type: 'GENERAL',
            mappings: [{ context: 'GIATA', code: '4001' }],
            texts: [
              { language: 'EN', text: 'Free Wi-Fi in all areas' },
              { language: 'DE', text: 'Kostenloses WLAN in allen Bereichen' },
            ],
          },
        },
      },
      // — Pools —
      {
        node: {
          amenityData: {
            code: 'POOL_OUTDOOR',
            amenityCode: 'OUTDOOR_POOL',
            type: 'HOTEL',
            mappings: [{ context: 'GIATA', code: '5010' }],
            texts: [
              { language: 'EN', text: 'Outdoor swimming pool' },
              { language: 'DE', text: 'Außenpool' },
            ],
          },
        },
      },
      {
        node: {
          amenityData: {
            code: 'POOL_ROOFTOP',
            amenityCode: 'ROOFTOP_POOL',
            type: 'HOTEL',
            texts: [
              { language: 'EN', text: 'Rooftop infinity pool' },
              { language: 'DE', text: 'Infinity-Pool auf dem Dach' },
            ],
          },
        },
      },
      // — Wellness & Spa —
      {
        node: {
          amenityData: {
            code: 'SPA',
            amenityCode: 'SPA',
            type: 'SERVICE',
            mappings: [{ context: 'GIATA', code: '6201' }],
            texts: [
              { language: 'EN', text: 'Full-service spa' },
              { language: 'DE', text: 'Full-Service-Spa' },
            ],
          },
        },
      },
      {
        node: {
          amenityData: {
            code: 'HAMMAM',
            amenityCode: 'HAMMAM',
            type: 'SERVICE',
            texts: [
              { language: 'EN', text: 'Traditional hammam' },
              { language: 'DE', text: 'Traditionelles Hammam' },
            ],
          },
        },
      },
      {
        node: {
          amenityData: {
            amenityCode: 'SAUNA',
            type: 'HOTEL',
            texts: [
              { language: 'EN', text: 'Sauna' },
              { language: 'DE', text: 'Sauna' },
            ],
          },
        },
      },
      // — Food & Drinks —
      {
        node: {
          amenityData: {
            code: 'RESTAURANT',
            amenityCode: 'RESTAURANT',
            type: 'SERVICE',
            mappings: [{ context: 'GIATA', code: '3001' }],
            texts: [
              { language: 'EN', text: 'Five restaurants on-site' },
              { language: 'DE', text: 'Fünf Restaurants im Haus' },
            ],
          },
        },
      },
      {
        node: {
          amenityData: {
            amenityCode: 'ROOM_SERVICE_24H',
            type: 'SERVICE',
            texts: [
              { language: 'EN', text: '24-hour room service' },
              { language: 'DE', text: '24-Stunden-Zimmerservice' },
            ],
          },
        },
      },
      {
        node: {
          amenityData: {
            amenityCode: 'BAR_LOUNGE',
            type: 'SERVICE',
            texts: [
              { language: 'EN', text: 'Lobby bar and lounge' },
              { language: 'DE', text: 'Lobbybar und Lounge' },
            ],
          },
        },
      },
      // — Transfers —
      {
        node: {
          amenityData: {
            code: 'AIRPORT_TRANSFER',
            amenityCode: 'AIRPORT_LIMO',
            type: 'SERVICE',
            mappings: [{ context: 'GIATA', code: '8001' }],
            texts: [
              { language: 'EN', text: 'Airport limousine transfer' },
              { language: 'DE', text: 'Flughafentransfer mit Limousine' },
            ],
          },
        },
      },
      // — Business —
      {
        node: {
          amenityData: {
            amenityCode: 'BUSINESS_CENTRE',
            type: 'SERVICE',
            texts: [
              { language: 'EN', text: 'Business centre' },
              { language: 'DE', text: 'Businesscenter' },
            ],
          },
        },
      },
      // — Family —
      {
        node: {
          amenityData: {
            code: 'KIDS_CLUB',
            amenityCode: 'KIDS_CLUB',
            type: 'SERVICE',
            texts: [
              { language: 'EN', text: 'Kids club' },
              { language: 'DE', text: 'Kinderclub' },
            ],
          },
        },
      },
      {
        node: {
          amenityData: {
            amenityCode: 'BABYSITTING',
            type: 'SERVICE',
            texts: [
              { language: 'EN', text: 'Babysitting on request' },
              { language: 'DE', text: 'Babysitter auf Anfrage' },
            ],
          },
        },
      },
      // — Accessibility —
      {
        node: {
          amenityData: {
            code: 'WHEELCHAIR_ACCESS',
            amenityCode: 'WHEELCHAIR_ACCESS',
            type: 'HOTEL',
            texts: [
              { language: 'EN', text: 'Wheelchair accessible entrance' },
              { language: 'DE', text: 'Rollstuhlgerechter Eingang' },
            ],
          },
        },
      },
      // — Safety & Security —
      {
        node: {
          amenityData: {
            amenityCode: 'SECURITY_24H',
            type: 'SERVICE',
            texts: [
              { language: 'EN', text: '24-hour security' },
              { language: 'DE', text: '24-Stunden-Sicherheitsdienst' },
            ],
          },
        },
      },
      {
        node: {
          amenityData: {
            amenityCode: 'IN_ROOM_SAFE',
            type: 'ROOM',
            texts: [
              { language: 'EN', text: 'In-room safe' },
              { language: 'DE', text: 'Safe im Zimmer' },
            ],
          },
        },
      },
      // — Languages spoken —
      {
        node: {
          amenityData: {
            amenityCode: 'LANG_EN',
            type: 'SERVICE',
            texts: [
              { language: 'EN', text: 'English' },
              { language: 'DE', text: 'Englisch' },
            ],
          },
        },
      },
      {
        node: {
          amenityData: {
            amenityCode: 'LANG_DE',
            type: 'SERVICE',
            texts: [
              { language: 'EN', text: 'German' },
              { language: 'DE', text: 'Deutsch' },
            ],
          },
        },
      },
      {
        node: {
          amenityData: {
            amenityCode: 'LANG_AR',
            type: 'SERVICE',
            texts: [
              { language: 'EN', text: 'Arabic' },
              { language: 'DE', text: 'Arabisch' },
            ],
          },
        },
      },
      // — Generic in-room comfort →  "general" —
      {
        node: {
          amenityData: {
            amenityCode: 'AIRCON',
            type: 'ROOM',
            texts: [
              { language: 'EN', text: 'Air conditioning' },
              { language: 'DE', text: 'Klimaanlage' },
            ],
          },
        },
      },
      // — Mid-confidence / ambiguous — should land in review —
      {
        node: {
          amenityData: {
            amenityCode: 'SHISHA_LOUNGE',
            type: 'SERVICE',
            texts: [
              { language: 'EN', text: 'Shisha lounge' },
              { language: 'DE', text: 'Shisha-Lounge' },
            ],
          },
        },
      },
      // — Junk metadata that must be dropped —
      {
        node: {
          amenityData: {
            amenityCode: 'SUPPLIER_CODE_4471',
            type: 'GENERAL',
            texts: [
              { language: 'EN', text: '4471' },
              { language: 'DE', text: '4471' },
            ],
          },
        },
      },
      {
        node: {
          amenityData: {
            amenityCode: 'INTERNAL_NOTE',
            type: 'GENERAL',
            texts: [
              { language: 'EN', text: '' },
              { language: 'DE', text: '' },
            ],
          },
        },
      },
    ],
  },
};
