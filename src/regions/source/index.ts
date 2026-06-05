// Hotel inventory adapter.
//
// Mirrors the FASTX source-adapter pattern (src/fastx/source/) so when a
// persistent shared Hotel table eventually lands, swapping the mock for a
// DB-backed source is one factory function.

import type { HotelPoint } from '../types';
import { MockHotelInventorySource } from './mock';

export interface HotelInventorySource {
  listHotels(): Promise<HotelPoint[]>;
  getHotel(hotelKey: string): Promise<HotelPoint | null>;
}

export function getHotelInventorySource(): HotelInventorySource {
  return new MockHotelInventorySource();
}

export { MockHotelInventorySource };
