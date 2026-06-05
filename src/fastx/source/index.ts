// Source adapter selection.
// FASTX_SOURCE=mock (default) → fixture-backed source.
// FASTX_SOURCE=live → HotelX GraphQL adapter (added in a later phase).
// Pipeline code consumes a FastXContentSource and never references either
// concrete adapter — keeps source ↔ classification cleanly separated.

import type { HotelData } from '../hotelx-types';
import { MockFastXSource } from './mock';

export type FastXSourceListing = {
  hotelCode: string;
  hotelName: string;
};

export interface FastXContentSource {
  getHotelContent(hotelCode: string): Promise<HotelData>;
  listAvailable(): Promise<FastXSourceListing[]>;
}

export function getFastXSource(): FastXContentSource {
  // Live adapter lands in Phase 4. Until then the env var only documents
  // intent; we still return the mock so the demo runs in any environment.
  return new MockFastXSource();
}

export { MockFastXSource };
