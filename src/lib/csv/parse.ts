import Papa from 'papaparse';

export type RawRow = Record<string, string>;

export type ParseResult = {
  headers: string[];
  rows: RawRow[];
  missingColumns: string[];
};

const REQUIRED_COLUMNS = ['name', 'city'] as const;

// Case-insensitive header aliases
const COLUMN_ALIASES: Record<string, string[]> = {
  name:      ['name', 'hotel_name', 'property_name', 'hotel name', 'property name', 'title'],
  city:      ['city', 'city_name', 'town', 'location'],
  country:   ['country', 'country_name', 'country_code'],
  address:   ['address', 'street_address', 'street', 'addr'],
  latitude:  ['latitude', 'lat', 'y'],
  longitude: ['longitude', 'lng', 'lon', 'long', 'x'],
  phone:     ['phone', 'telephone', 'tel', 'phone_number'],
  id:        ['id', 'hotel_id', 'property_id', 'source_id', 'code'],
};

export function detectColumn(headers: string[], canonical: string): string | undefined {
  const aliases = COLUMN_ALIASES[canonical] ?? [canonical];
  return headers.find((h) => aliases.includes(h.toLowerCase().trim()));
}

export function parseCSVText(text: string): ParseResult {
  const result = Papa.parse<RawRow>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const headers = result.meta.fields ?? [];
  const rows = result.data;

  const missingColumns: string[] = [];
  for (const col of REQUIRED_COLUMNS) {
    if (!detectColumn(headers, col)) {
      missingColumns.push(col);
    }
  }

  return { headers, rows, missingColumns };
}
