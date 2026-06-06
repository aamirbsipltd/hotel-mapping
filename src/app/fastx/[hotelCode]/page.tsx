import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getFastXSource } from '@/fastx/source';
import { getWorkbenchState } from '@/fastx/service/workbench-state';
import FastXWorkbench from '@/fastx/admin/workbench';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'FastX Workbench · Hotel Mapping Tool',
  description:
    'Classify a Travelgate FastX hotel and resolve the review queue. Approving an item writes back to the mapping dictionary so future runs auto-classify the same amenity.',
};

type Params = Promise<{ hotelCode: string }>;

export default async function FastXHotelPage({ params }: { params: Params }) {
  const { hotelCode } = await params;
  const decoded = decodeURIComponent(hotelCode);

  // Make sure the requested fixture exists before we boot the workbench.
  const source = getFastXSource();
  try {
    await source.getHotelContent(decoded);
  } catch {
    notFound();
  }

  const initialState = await getWorkbenchState(decoded);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <div className="space-y-2">
        <Link
          href="/fastx"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All demo hotels
        </Link>
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground">
            {initialState.latestRun?.hotelName ?? decoded}
          </h1>
          <p className="text-xs font-mono text-muted-foreground">{decoded}</p>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Classify the fixture (or a pasted <code className="font-mono text-xs">HotelData</code> payload) and resolve the review queue. Approving a review item writes back to the mapping dictionary keyed by the same identifier Stage 1 looks up — the next classify run auto-classifies that amenity, and the auto-rate moves visibly.
        </p>
      </div>
      <FastXWorkbench initialState={initialState} />
    </div>
  );
}
