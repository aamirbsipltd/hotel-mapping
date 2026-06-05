// POST /api/regions/run
//
// Runs assign-all and returns the updated workbench state. The engine
// reads + index-builds fresh inside runAssignAll — no module-level cache,
// so polygon edits made in the same session take effect on this call.

import { NextResponse } from 'next/server';
import { runAssignAll } from '@/regions/service/run-assign-all';
import { getWorkbenchState } from '@/regions/service/workbench-state';

export const dynamic = 'force-dynamic';

export async function POST() {
  await runAssignAll();
  const state = await getWorkbenchState();
  return NextResponse.json(state);
}
