import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updateMatchDecision } from '@/lib/session/update';

const Body = z.object({
  matchId: z.string(),
  accepted: z.boolean(),
  locationId: z.string().optional(),
  confidence: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const body = Body.safeParse(json);

    if (!body.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    await updateMatchDecision(body.data.matchId, body.data.accepted);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[decision]', err);
    return NextResponse.json({ error: 'Failed to save decision' }, { status: 500 });
  }
}
