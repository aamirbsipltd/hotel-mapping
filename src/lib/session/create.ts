import 'server-only';
import { prisma } from '@/lib/prisma';
import type { NormalizedRow } from '@/lib/csv/normalize';
import { env } from '@/lib/env';

export async function createSession(
  rows: NormalizedRow[],
  isPaid: boolean,
  byok: boolean = false,
  byokKey?: string,
): Promise<string> {
  const cap = isPaid ? rows.length : Math.min(rows.length, env.DEMO_ROW_LIMIT);
  const cappedRows = rows.slice(0, cap);

  const session = await prisma.session.create({
    data: {
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isPaid,
      byok,
      byokKey: byokKey ?? null,
      rowsTotal: cappedRows.length,
      status: 'queued',
      matches: {
        create: cappedRows.map((row, i) => ({
          rowIndex: i,
          sourceId: row.id,
          sourceName: row.name,
          sourceCity: row.city || null,
          sourceCountry: row.country || null,
          sourceLat: row.latitude ?? null,
          sourceLng: row.longitude ?? null,
          sourceAddress: row.address || null,
          sourcePhone: row.phone || null,
          status: 'pending',
        })),
      },
    },
  });

  return session.id;
}
