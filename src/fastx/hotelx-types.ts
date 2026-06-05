// Internal mirror of the relevant slice of the Travelgate HotelX content type.
// Field names match the GraphQL schema exactly so the live adapter can map a
// HotelX response into this shape with no renames. Optional fields reflect
// what the live API actually returns as nullable.

export type Language = 'EN' | 'DE' | 'FR' | 'ES' | 'IT' | 'AR' | 'ZH' | string;

export type ApplicationAreaType = 'HOTEL' | 'ROOM' | 'SERVICE' | 'GENERAL';

export type DescriptionType =
  | 'GENERAL'
  | 'SHORT'
  | 'LARGE'
  | 'AREA'
  | 'LOCATION'
  | 'POI'
  | 'ROOM';

export type LangText = {
  text: string;
  language: Language;
};

export type HotelXMappedCode = {
  context: string; // e.g. "TGX" | "GIATA"
  code: string;
};

export type GiataData = {
  id?: string;
  source?: string;
  href?: string;
};

export type PaymentCardType = {
  code: string;
};

export type HotelXAmenityData = {
  code?: string;          // Travelgate canonical amenity code
  amenityCode?: string;   // external / supplier amenity code
  type?: ApplicationAreaType;
  texts?: LangText[];     // descriptive text per language
  value?: LangText[];     // value per language
  mappings?: HotelXMappedCode[];
};

export type HotelXAmenityNode = {
  amenityData: HotelXAmenityData;
};

export type HotelXAmenityEdge = {
  node: HotelXAmenityNode;
};

export type HotelXAmenityConnection = {
  edges: HotelXAmenityEdge[];
};

export type Description = {
  type: DescriptionType;
  text: string;
  language: Language;
};

// Top-level hotel content the pipeline consumes. The mock and live source
// adapters both return this shape; the pipeline is unaware of which source
// produced it.
export type HotelData = {
  hotelCode: string;
  hotelName?: string;
  categoryCode?: string;
  giataData?: GiataData;
  cardTypes?: PaymentCardType[];
  allAmenities?: HotelXAmenityConnection;
  descriptions?: Description[];
  mappings?: HotelXMappedCode[];
};
