import { NextRequest, NextResponse } from 'next/server';
import { loadSession, loadMatches } from '@/lib/session/load';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;

  const session = await loadSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const matches = await loadMatches(sessionId);
  const currentMatch = matches.find((m) => m.status === 'pending');

  return NextResponse.json({
    status: session.status,
    rowsTotal: session.rowsTotal,
    rowsProcessed: session.rowsProcessed,
    currentHotelName: currentMatch?.sourceName ?? null,
    isPaid: session.isPaid,
  });
}
