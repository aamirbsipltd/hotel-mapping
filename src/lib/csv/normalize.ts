import { type RawRow, detectColumn } from './parse';

export type NormalizedRow = {
  originalIndex: number;
  rawRow: RawRow;
  id: string;
  name: string;
  city: string;
  country?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
};

function parseFloat_(s?: string): number | undefined {
  if (!s) return undefined;
  const n = parseFloat(s.trim());
  return isNaN(n) ? undefined : n;
}

function normalizePhone(s?: string): string | undefined {
  if (!s) return undefined;
  const digits = s.replace(/\D/g, '');
  return digits.length >= 7 ? digits : undefined;
}

export function normalizeRows(headers: string[], rows: RawRow[]): NormalizedRow[] {
  const col = (canonical: string) => detectColumn(headers, canonical);

  const nameCol    = col('name')      ?? 'name';
  const cityCol    = col('city')      ?? 'city';
  const countryCol = col('country');
  const addressCol = col('address');
  const latCol     = col('latitude');
  const lngCol     = col('longitude');
  const phoneCol   = col('phone');
  const idCol      = col('id');

  return rows.map((row, i) => ({
    originalIndex: i,
    rawRow: row,
    id:       idCol ? (row[idCol] ?? String(i + 1)) : String(i + 1),
    name:     row[nameCol]?.trim() ?? '',
    city:     row[cityCol]?.trim() ?? '',
    country:  countryCol ? row[countryCol]?.trim() : undefined,
    address:  addressCol ? row[addressCol]?.trim() : undefined,
    latitude: latCol     ? parseFloat_(row[latCol]) : undefined,
    longitude: lngCol    ? parseFloat_(row[lngCol]) : undefined,
    phone:    phoneCol   ? normalizePhone(row[phoneCol]) : undefined,
  })).filter((r) => r.name.length > 0);
}
