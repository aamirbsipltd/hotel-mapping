import type { HotelPoint } from '../types';
import { FIXTURE_HOTELS } from '../fixtures/hotels';
import type { HotelInventorySource } from './index';

export class MockHotelInventorySource implements HotelInventorySource {
  async listHotels(): Promise<HotelPoint[]> {
    // Defensive clone — callers must not mutate the seed array.
    return FIXTURE_HOTELS.map((h) => ({ ...h }));
  }

  async getHotel(hotelKey: string): Promise<HotelPoint | null> {
    const hit = FIXTURE_HOTELS.find((h) => h.hotelKey === hotelKey);
    return hit ? { ...hit } : null;
  }
}
