// POST /api/fastx/classify
//
// Two modes:
//   { hotelCode: string }                → classify a fixture by code
//   { hotelData: <HotelData> }           → classify pasted JSON
//
// Returns the post-mutation workbench state so the client can replace
// its state wholesale (single-fetch pattern, no optimistic UI).

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { classifyAndPersist, classifyByHotelCode } from '@/fastx/service/classify-run';
import { getWorkbenchState } from '@/fastx/service/workbench-state';
import { hotelDataSchema } from '@/fastx/service/hoteldata-schema';

export const dynamic = 'force-dynamic';

const bodySchema = z.union([
  z.object({ hotelCode: z.string().min(1) }),
  z.object({ hotelData: hotelDataSchema }),
]);

export async function POST(req: Request) {
  const json = await req.json();
  const body = bodySchema.safeParse(json);
  if (!body.success) {
    return NextResponse.json(
      {
        error: 'invalid body',
        issues: body.error.flatten(),
      },
      { status: 400 },
    );
  }

  let outcome;
  let hotelCode: string;
  try {
    if ('hotelCode' in body.data) {
      outcome = await classifyByHotelCode(body.data.hotelCode);
      hotelCode = body.data.hotelCode;
    } else {
      outcome = await classifyAndPersist(body.data.hotelData);
      hotelCode = body.data.hotelData.hotelCode;
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 400 },
    );
  }

  const state = await getWorkbenchState(hotelCode);
  return NextResponse.json({ runId: outcome.runId, state }, { status: 201 });
}
