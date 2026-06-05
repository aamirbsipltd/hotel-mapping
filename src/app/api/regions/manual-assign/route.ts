// POST /api/regions/manual-assign
//
// Operator clicked a hotel marker and reassigned (or unassigned) it. Writes
// method=MANUAL, isOverride=true. Does NOT run the engine — the override is
// a single-row mutation that subsequent batch runs respect.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { manualAssign } from '@/regions/service/store';
import { getWorkbenchState } from '@/regions/service/workbench-state';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  hotelKey: z.string().min(1),
  regionId: z.string().nullable(),
});

export async function POST(req: Request) {
  const json = await req.json();
  const body = bodySchema.safeParse(json);
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }
  await manualAssign(body.data.hotelKey, body.data.regionId);
  const state = await getWorkbenchState();
  return NextResponse.json(state);
}
