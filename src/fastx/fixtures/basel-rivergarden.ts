// Fixture B — cleaner DACH-region property.
// Smaller amenity set, fewer landmines, demonstrates the EN/DE toggle on a
// market-relevant hotel. Still includes one cardTypes leak and one POI
// mention so the pipeline's field-separation is exercised here too.

import type { HotelData } from '../hotelx-types';

export const baselHotel: HotelData = {
  hotelCode: 'TGX-BSL-2042',
  hotelName: 'Hotel RiverGarden Basel',
  categoryCode: '4EST',
  giataData: {
    id: '318277',
    source: 'GIATA',
    href: 'https://giatadrive.com/properties/318277',
  },
  mappings: [
    { context: 'TGX', code: 'TGX-BSL-2042' },
    { context: 'GIATA', code: '318277' },
  ],
  cardTypes: [{ code: 'VI' }, { code: 'MC' }],
  descriptions: [
    {
      type: 'GENERAL',
      language: 'EN',
      text: 'Boutique riverside hotel near Basel SBB station and the Old Town. Steps from the Rhine promenade.',
    },
    {
      type: 'GENERAL',
      language: 'DE',
      text: 'Boutiquehotel am Rhein, nahe Basel SBB und der Altstadt. Wenige Schritte zur Rheinpromenade.',
    },
    {
      type: 'POI',
      language: 'EN',
      text: 'Basel SBB station — 0.4 km. Münster Cathedral — 0.9 km. Kunstmuseum Basel — 0.7 km.',
    },
  ],
  allAmenities: {
    edges: [
      {
        node: {
          amenityData: {
            code: 'WIFI_FREE',
            amenityCode: 'WIFI',
            type: 'GENERAL',
            mappings: [{ context: 'GIATA', code: '4001' }],
            texts: [
              { language: 'EN', text: 'Free Wi-Fi' },
              { language: 'DE', text: 'Kostenloses WLAN' },
            ],
          },
        },
      },
      {
        node: {
          amenityData: {
            amenityCode: 'BREAKFAST',
            type: 'SERVICE',
            texts: [
              { language: 'EN', text: 'Continental breakfast' },
              { language: 'DE', text: 'Kontinentales Frühstück' },
            ],
          },
        },
      },
      {
        node: {
          amenityData: {
            amenityCode: 'BAR',
            type: 'SERVICE',
            texts: [
              { language: 'EN', text: 'Hotel bar' },
              { language: 'DE', text: 'Hotelbar' },
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
      {
        node: {
          amenityData: {
            amenityCode: 'MEETING_ROOM',
            type: 'SERVICE',
            texts: [
              { language: 'EN', text: 'Meeting room' },
              { language: 'DE', text: 'Konferenzraum' },
            ],
          },
        },
      },
      {
        node: {
          amenityData: {
            amenityCode: 'ELEVATOR',
            type: 'HOTEL',
            texts: [
              { language: 'EN', text: 'Elevator' },
              { language: 'DE', text: 'Aufzug' },
            ],
          },
        },
      },
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
            amenityCode: 'LANG_FR',
            type: 'SERVICE',
            texts: [
              { language: 'EN', text: 'French' },
              { language: 'DE', text: 'Französisch' },
            ],
          },
        },
      },
      {
        node: {
          amenityData: {
            amenityCode: 'NON_SMOKING',
            type: 'HOTEL',
            texts: [
              { language: 'EN', text: 'Non-smoking property' },
              { language: 'DE', text: 'Nichtraucherhotel' },
            ],
          },
        },
      },
      {
        node: {
          amenityData: {
            amenityCode: 'BIKE_RENTAL',
            type: 'SERVICE',
            texts: [
              { language: 'EN', text: 'Bicycle rental' },
              { language: 'DE', text: 'Fahrradverleih' },
            ],
          },
        },
      },
    ],
  },
};
