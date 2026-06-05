// Seed mapping dictionary.
//
// Maps stable supplier-side identifiers — Travelgate canonical codes, GIATA
// codes, or normalised text tokens — to the canonical category IDs in
// taxonomy.ts. Stage 1 of the pipeline resolves against this map; review-
// queue approvals (Phase 2) append further entries via AmenityMapping in
// the database, which the workbench merges in at runtime.
//
// Keys are case-sensitive for non-text key types; text keys are stored
// in already-normalised form (see classify/normalize.ts → normaliseKey).

import type { CategoryId } from '../taxonomy';

export type MappingKeyType = 'TGX' | 'GIATA' | 'SUPPLIER' | 'TEXT';

export type MappingEntry = {
  key: string;
  keyType: MappingKeyType;
  categoryId: CategoryId;
};

// Internet
const INTERNET: MappingEntry[] = [
  { key: 'WIFI', keyType: 'SUPPLIER', categoryId: 'internet' },
  { key: 'WIFI_FREE', keyType: 'TGX', categoryId: 'internet' },
  { key: 'WIFI_PAID', keyType: 'SUPPLIER', categoryId: 'internet' },
  { key: 'INTERNET', keyType: 'SUPPLIER', categoryId: 'internet' },
  { key: '4001', keyType: 'GIATA', categoryId: 'internet' },
];

// Pools
const POOLS: MappingEntry[] = [
  { key: 'POOL', keyType: 'SUPPLIER', categoryId: 'pools' },
  { key: 'POOL_OUTDOOR', keyType: 'TGX', categoryId: 'pools' },
  { key: 'POOL_INDOOR', keyType: 'TGX', categoryId: 'pools' },
  { key: 'OUTDOOR_POOL', keyType: 'SUPPLIER', categoryId: 'pools' },
  { key: 'INDOOR_POOL', keyType: 'SUPPLIER', categoryId: 'pools' },
  { key: 'POOL_ROOFTOP', keyType: 'TGX', categoryId: 'pools' },
  { key: 'ROOFTOP_POOL', keyType: 'SUPPLIER', categoryId: 'pools' },
  { key: '5010', keyType: 'GIATA', categoryId: 'pools' },
];

// Wellness & Spa
const WELLNESS: MappingEntry[] = [
  { key: 'SPA', keyType: 'SUPPLIER', categoryId: 'wellness_spa' },
  { key: 'SAUNA', keyType: 'SUPPLIER', categoryId: 'wellness_spa' },
  { key: 'STEAM_ROOM', keyType: 'SUPPLIER', categoryId: 'wellness_spa' },
  { key: 'HAMMAM', keyType: 'SUPPLIER', categoryId: 'wellness_spa' },
  { key: 'MASSAGE', keyType: 'SUPPLIER', categoryId: 'wellness_spa' },
  { key: 'JACUZZI', keyType: 'SUPPLIER', categoryId: 'wellness_spa' },
  { key: 'HOT_TUB', keyType: 'SUPPLIER', categoryId: 'wellness_spa' },
  { key: 'WELLNESS', keyType: 'SUPPLIER', categoryId: 'wellness_spa' },
  { key: '6201', keyType: 'GIATA', categoryId: 'wellness_spa' },
];

// Food & Drinks
const FOOD: MappingEntry[] = [
  { key: 'RESTAURANT', keyType: 'SUPPLIER', categoryId: 'food_drink' },
  { key: 'BREAKFAST', keyType: 'SUPPLIER', categoryId: 'food_drink' },
  { key: 'BAR', keyType: 'SUPPLIER', categoryId: 'food_drink' },
  { key: 'BAR_LOUNGE', keyType: 'SUPPLIER', categoryId: 'food_drink' },
  { key: 'ROOM_SERVICE', keyType: 'SUPPLIER', categoryId: 'food_drink' },
  { key: 'ROOM_SERVICE_24H', keyType: 'SUPPLIER', categoryId: 'food_drink' },
  { key: 'CAFE', keyType: 'SUPPLIER', categoryId: 'food_drink' },
  { key: '3001', keyType: 'GIATA', categoryId: 'food_drink' },
];

// Transfers
const TRANSFERS: MappingEntry[] = [
  { key: 'AIRPORT_TRANSFER', keyType: 'TGX', categoryId: 'transfers' },
  { key: 'AIRPORT_SHUTTLE', keyType: 'SUPPLIER', categoryId: 'transfers' },
  { key: 'AIRPORT_LIMO', keyType: 'SUPPLIER', categoryId: 'transfers' },
  { key: 'SHUTTLE', keyType: 'SUPPLIER', categoryId: 'transfers' },
  { key: 'PARKING_VALET', keyType: 'SUPPLIER', categoryId: 'transfers' },
  { key: '8001', keyType: 'GIATA', categoryId: 'transfers' },
];

// Business
const BUSINESS: MappingEntry[] = [
  { key: 'BUSINESS_CENTRE', keyType: 'SUPPLIER', categoryId: 'business' },
  { key: 'BUSINESS_CENTER', keyType: 'SUPPLIER', categoryId: 'business' },
  { key: 'MEETING_ROOM', keyType: 'SUPPLIER', categoryId: 'business' },
  { key: 'CONFERENCE_ROOM', keyType: 'SUPPLIER', categoryId: 'business' },
  { key: 'COWORKING', keyType: 'SUPPLIER', categoryId: 'business' },
];

// Family
const FAMILY: MappingEntry[] = [
  { key: 'KIDS_CLUB', keyType: 'TGX', categoryId: 'family' },
  { key: 'BABYSITTING', keyType: 'SUPPLIER', categoryId: 'family' },
  { key: 'PLAYGROUND', keyType: 'SUPPLIER', categoryId: 'family' },
  { key: 'COT', keyType: 'SUPPLIER', categoryId: 'family' },
  { key: 'CRIB', keyType: 'SUPPLIER', categoryId: 'family' },
];

// Accessibility
const ACCESSIBILITY: MappingEntry[] = [
  { key: 'WHEELCHAIR_ACCESS', keyType: 'TGX', categoryId: 'accessibility' },
  { key: 'WHEELCHAIR_ACCESSIBLE', keyType: 'SUPPLIER', categoryId: 'accessibility' },
  { key: 'ELEVATOR', keyType: 'SUPPLIER', categoryId: 'accessibility' },
  { key: 'LIFT', keyType: 'SUPPLIER', categoryId: 'accessibility' },
  { key: 'BRAILLE', keyType: 'SUPPLIER', categoryId: 'accessibility' },
  { key: 'ROLL_IN_SHOWER', keyType: 'SUPPLIER', categoryId: 'accessibility' },
];

// Languages spoken
const LANGUAGES: MappingEntry[] = [
  { key: 'LANG_EN', keyType: 'SUPPLIER', categoryId: 'languages' },
  { key: 'LANG_DE', keyType: 'SUPPLIER', categoryId: 'languages' },
  { key: 'LANG_FR', keyType: 'SUPPLIER', categoryId: 'languages' },
  { key: 'LANG_ES', keyType: 'SUPPLIER', categoryId: 'languages' },
  { key: 'LANG_IT', keyType: 'SUPPLIER', categoryId: 'languages' },
  { key: 'LANG_AR', keyType: 'SUPPLIER', categoryId: 'languages' },
];

// Safety & Security
const SAFETY: MappingEntry[] = [
  { key: 'SECURITY_24H', keyType: 'SUPPLIER', categoryId: 'safety_security' },
  { key: 'CCTV', keyType: 'SUPPLIER', categoryId: 'safety_security' },
  { key: 'IN_ROOM_SAFE', keyType: 'SUPPLIER', categoryId: 'safety_security' },
  { key: 'SAFE', keyType: 'SUPPLIER', categoryId: 'safety_security' },
  { key: 'SMOKE_DETECTOR', keyType: 'SUPPLIER', categoryId: 'safety_security' },
  { key: 'FIRE_EXTINGUISHER', keyType: 'SUPPLIER', categoryId: 'safety_security' },
];

// General — last resort for in-room comfort and unmapped "house" facilities.
const GENERAL: MappingEntry[] = [
  { key: 'AIRCON', keyType: 'SUPPLIER', categoryId: 'general' },
  { key: 'AIR_CONDITIONING', keyType: 'SUPPLIER', categoryId: 'general' },
  { key: 'HEATING', keyType: 'SUPPLIER', categoryId: 'general' },
  { key: 'TV', keyType: 'SUPPLIER', categoryId: 'general' },
  { key: 'NON_SMOKING', keyType: 'SUPPLIER', categoryId: 'general' },
];

export const SEED_MAPPINGS: MappingEntry[] = [
  ...INTERNET,
  ...POOLS,
  ...WELLNESS,
  ...FOOD,
  ...TRANSFERS,
  ...BUSINESS,
  ...FAMILY,
  ...ACCESSIBILITY,
  ...LANGUAGES,
  ...SAFETY,
  ...GENERAL,
];

export function buildSeedDictionary(): Map<string, CategoryId> {
  const map = new Map<string, CategoryId>();
  for (const entry of SEED_MAPPINGS) {
    map.set(`${entry.keyType}:${entry.key}`, entry.categoryId);
  }
  return map;
}
