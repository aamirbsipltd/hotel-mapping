// GET  /api/fastx?hotelCode=... → workbench state for that hotel
//
// Returns the full workbench state in one call. Mirrors GET /api/regions.

import { NextResponse } from 'next/server';
import { getWorkbenchState } from '@/fastx/service/workbench-state';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const hotelCode = url.searchParams.get('hotelCode');
  const state = await getWorkbenchState(hotelCode);
  return NextResponse.json(state);
}
