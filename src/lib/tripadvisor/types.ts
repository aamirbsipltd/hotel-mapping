import { z } from 'zod';

const Address = z.object({
  street1: z.string().optional(),
  street2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalcode: z.string().optional(),
  address_string: z.string().optional(),
});

export type TaAddress = z.infer<typeof Address>;

export const LocationMatch = z.object({
  location_id: z.string(),
  name: z.string(),
  address_obj: Address.optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  phone: z.string().optional(),
  web_url: z.string().url().optional(),
  rating: z.string().optional(),
  num_reviews: z.string().optional(),
});

export type TaLocationMatch = z.infer<typeof LocationMatch>;

export const LocationMapperResponse = z.object({
  data: z.array(LocationMatch),
});

export const LocationSearchResponse = z.object({
  data: z.array(LocationMatch),
});

export const LocationDetailsResponse = z.object({
  location_id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  web_url: z.string().url(),
  address_obj: Address.optional(),
  ranking_data: z.object({ ranking_string: z.string().optional() }).optional(),
  rating: z.string().optional(),
  rating_image_url: z.string().url().optional(),
  num_reviews: z.string().optional(),
  review_rating_count: z.record(z.string(), z.string()).optional(),
  subratings: z.record(z.string(), z.object({
    name: z.string(),
    rating_image_url: z.string().url(),
    value: z.string(),
    localized_name: z.string(),
  })).optional(),
  phone: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

export type TaLocationDetails = z.infer<typeof LocationDetailsResponse>;

// Helpers to convert TA's string lat/lng to numbers
export function parseLatLng(s?: string): number | undefined {
  if (!s) return undefined;
  const n = parseFloat(s);
  return isNaN(n) ? undefined : n;
}

export function addressToString(addr?: TaAddress): string | undefined {
  if (!addr) return undefined;
  return addr.address_string ?? [addr.street1, addr.city, addr.country].filter(Boolean).join(', ');
}
