import type { HotelData } from '../hotelx-types';
import { FIXTURES } from '../fixtures';
import type { FastXContentSource, FastXSourceListing } from './index';

export class MockFastXSource implements FastXContentSource {
  async getHotelContent(hotelCode: string): Promise<HotelData> {
    const fixture = FIXTURES.find((f) => f.hotelCode === hotelCode);
    if (!fixture) {
      throw new Error(`Unknown hotelCode: ${hotelCode}`);
    }
    // Defensive clone — pipeline must never mutate the fixture source.
    return JSON.parse(JSON.stringify(fixture)) as HotelData;
  }

  async listAvailable(): Promise<FastXSourceListing[]> {
    return FIXTURES.map((f) => ({
      hotelCode: f.hotelCode,
      hotelName: f.hotelName ?? f.hotelCode,
    }));
  }
}
