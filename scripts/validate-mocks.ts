import { LocationMapperResponse, LocationSearchResponse, LocationDetailsResponse } from '../src/lib/tripadvisor/types';

const mockMapperResponse = {
  data: [
    {
      location_id: '262256',
      name: 'Grand Hyatt Berlin',
      address_obj: {
        street1: 'Marlene-Dietrich-Platz 2',
        city: 'Berlin',
        country: 'Germany',
        postalcode: '10785',
        address_string: 'Marlene-Dietrich-Platz 2, 10785 Berlin Germany',
      },
      latitude: '52.5093',
      longitude: '13.3785',
      phone: '+49 30 25531234',
    },
  ],
};

const mockSearchResponse = {
  data: [
    {
      location_id: '508038',
      name: 'Hotel Adlon Kempinski Berlin',
      address_obj: {
        street1: 'Unter den Linden 77',
        city: 'Berlin',
        country: 'Germany',
        postalcode: '10117',
        address_string: 'Unter den Linden 77, 10117 Berlin Germany',
      },
      latitude: '52.5163',
      longitude: '13.3788',
    },
  ],
};

const mockDetailsResponse = {
  location_id: '262256',
  name: 'Grand Hyatt Berlin',
  web_url: 'https://www.tripadvisor.com/Hotel_Review-g187323-d262256-Reviews-Grand_Hyatt_Berlin-Berlin.html',
  address_obj: {
    street1: 'Marlene-Dietrich-Platz 2',
    city: 'Berlin',
    country: 'Germany',
    postalcode: '10785',
    address_string: 'Marlene-Dietrich-Platz 2, 10785 Berlin Germany',
  },
  rating: '4.5',
  rating_image_url: 'https://static.tacdn.com/img2/ratings/traveler/4.5.svg',
  num_reviews: '2841',
};

let failures = 0;

function validate<T>(name: string, schema: { safeParse: (data: unknown) => { success: boolean; error?: { message: string } } }, data: unknown): void {
  const result = schema.safeParse(data);
  if (result.success) {
    console.log(`  ✓ ${name}`);
  } else {
    console.error(`  ✗ ${name}: ${result.error?.message}`);
    failures++;
  }
}

console.log('Validating mock data against Zod schemas...\n');

validate('LocationMapperResponse', LocationMapperResponse, mockMapperResponse);
validate('LocationSearchResponse', LocationSearchResponse, mockSearchResponse);
validate('LocationDetailsResponse', LocationDetailsResponse, mockDetailsResponse);

console.log('');
if (failures > 0) {
  console.error(`${failures} validation(s) failed.`);
  process.exit(1);
} else {
  console.log('All mocks valid.');
}
