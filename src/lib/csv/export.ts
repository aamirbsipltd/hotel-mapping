import Papa from 'papaparse';
import type { Match } from '@/generated/prisma/client';
import type { RawRow } from './parse';

export type ExportRow = RawRow & {
  tripadvisor_location_id: string;
  confidence_score: string;
  match_status: string;
  tripadvisor_url: string;
};

export function buildExportCSV(
  matches: Match[],
  isPaid: boolean,
): string {
  const rows: ExportRow[] = matches
    .sort((a, b) => a.rowIndex - b.rowIndex)
    .map((m) => {
      const raw: RawRow = {};
      raw['source_name']    = m.sourceName;
      raw['source_city']    = m.sourceCity ?? '';
      raw['source_country'] = m.sourceCountry ?? '';
      raw['source_address'] = m.sourceAddress ?? '';

      return {
        ...raw,
        tripadvisor_location_id: m.selectedLocationId ?? '',
        confidence_score: m.selectedConfidence != null
          ? (m.selectedConfidence * 100).toFixed(1) + '%'
          : '',
        match_status: m.status,
        tripadvisor_url: m.selectedLocationId
          ? `https://www.tripadvisor.com/Hotel_Review-d${m.selectedLocationId}`
          : '',
      };
    });

  const csv = Papa.unparse(rows);

  if (!isPaid) {
    return `# Demo export — hotelmappingtool.com (first ${rows.length} rows only)\n${csv}`;
  }

  return csv;
}
