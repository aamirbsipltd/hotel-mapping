// GET  /api/regions          → full workbench state
// POST /api/regions          → create a new region (operator drew a polygon)
//
// Both responses return the post-mutation workbench state so the client
// can re-render without a second round-trip.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getWorkbenchState } from '@/regions/service/workbench-state';
import { createRegion, polygonOrMultiSchema } from '@/regions/service/regions-mutations';
import { runAssignAll } from '@/regions/service/run-assign-all';

export const dynamic = 'force-dynamic';

export async function GET() {
  const state = await getWorkbenchState();
  return NextResponse.json(state);
}

const createBodySchema = z.object({
  name: z.string().min(1).max(120),
  destinationId: z.string().min(1),
  polygon: polygonOrMultiSchema,
});

export async function POST(req: Request) {
  const json = await req.json();
  const body = createBodySchema.safeParse(json);
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }
  await createRegion(body.data);
  // Re-run so the hotels inside the new polygon snap into it immediately.
  // Manual overrides survive (the engine respects them via preserveMap).
  await runAssignAll();
  const state = await getWorkbenchState();
  return NextResponse.json(state, { status: 201 });
}
