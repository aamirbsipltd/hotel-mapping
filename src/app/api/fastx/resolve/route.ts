// POST /api/fastx/resolve
//
// Operator approved or reassigned a review item. Writes back to
// AmenityMapping via the service layer. Does NOT re-run the classifier
// — the operator hits "Re-classify" afterwards to see the result of
// their decision. (Same separation as region's manual-assign vs
// re-run.)

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveReviewItem } from '@/fastx/service/resolve-review';
import { getWorkbenchState } from '@/fastx/service/workbench-state';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  reviewItemId: z.string().min(1),
  categoryId: z.string().min(1),
  hotelCode: z.string().min(1),
});

export async function POST(req: Request) {
  const json = await req.json();
  const body = bodySchema.safeParse(json);
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }
  try {
    await resolveReviewItem(body.data.reviewItemId, body.data.categoryId);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 400 },
    );
  }
  const state = await getWorkbenchState(body.data.hotelCode);
  return NextResponse.json(state);
}
