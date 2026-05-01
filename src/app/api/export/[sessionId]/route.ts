import { NextRequest, NextResponse } from 'next/server';
import { loadSessionWithMatches } from '@/lib/session/load';
import { buildExportCSV } from '@/lib/csv/export';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;

  const session = await loadSessionWithMatches(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const csv = buildExportCSV(session.matches, session.isPaid);
  const filename = `hotel-mapping-${sessionId.slice(0, 8)}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
