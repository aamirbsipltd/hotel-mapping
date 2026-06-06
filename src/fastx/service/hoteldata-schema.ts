// Zod schema for inbound HotelData (paste-JSON input).
//
// Operator/prospect input hits the system at the workbench's paste box.
// Fail loud on malformed payloads — silent "classified zero amenities"
// is the failure mode that wastes the prospect's time. The schema
// mirrors the relevant slice of hotelx-types.ts; we don't require every
// HotelX field (live responses are sparse on the optional ones), only
// enough that triage has something to work with.

import { z } from 'zod';

const langTextSchema = z.object({
  text: z.string(),
  language: z.string(),
});

const mappingSchema = z.object({
  context: z.string(),
  code: z.string(),
});

const amenityDataSchema = z.object({
  code: z.string().optional(),
  amenityCode: z.string().optional(),
  type: z.enum(['HOTEL', 'ROOM', 'SERVICE', 'GENERAL']).optional(),
  texts: z.array(langTextSchema).optional(),
  value: z.array(langTextSchema).optional(),
  mappings: z.array(mappingSchema).optional(),
});

const amenityEdgeSchema = z.object({
  node: z.object({ amenityData: amenityDataSchema }),
});

const descriptionSchema = z.object({
  type: z.enum(['GENERAL', 'SHORT', 'LARGE', 'AREA', 'LOCATION', 'POI', 'ROOM']),
  text: z.string(),
  language: z.string(),
});

export const hotelDataSchema = z.object({
  hotelCode: z.string().min(1),
  hotelName: z.string().optional(),
  categoryCode: z.string().optional(),
  giataData: z
    .object({
      id: z.string().optional(),
      source: z.string().optional(),
      href: z.string().optional(),
    })
    .optional(),
  cardTypes: z.array(z.object({ code: z.string() })).optional(),
  allAmenities: z
    .object({
      edges: z.array(amenityEdgeSchema),
    })
    .optional(),
  descriptions: z.array(descriptionSchema).optional(),
  mappings: z.array(mappingSchema).optional(),
});
