import { NextRequest, NextResponse } from 'next/server';
import { parseCSVText } from '@/lib/csv/parse';
import { normalizeRows } from '@/lib/csv/normalize';
import { createSession } from '@/lib/session/create';
import { runMatchingPipeline } from '@/lib/matching/pipeline';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const byokKey = formData.get('byokKey') as string | null;

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await (file as File).text();
    const { headers, rows, missingColumns } = parseCSVText(text);

    if (missingColumns.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing required columns',
          missingColumns,
          message: `Your CSV is missing: ${missingColumns.join(', ')}. These columns are required.`,
        },
        { status: 422 },
      );
    }

    const normalized = normalizeRows(headers, rows);

    if (normalized.length === 0) {
      return NextResponse.json({ error: 'CSV contains no valid rows' }, { status: 422 });
    }

    const isPaid = false; // Stripe webhook sets this after payment
    const byok = !!byokKey;
    const sessionId = await createSession(normalized, isPaid, byok, byokKey ?? undefined);

    // Fire and forget — matching runs asynchronously in the background
    void runMatchingPipeline(sessionId, byokKey ?? undefined);

    return NextResponse.json({ sessionId });
  } catch (err) {
    console.error('[upload]', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
