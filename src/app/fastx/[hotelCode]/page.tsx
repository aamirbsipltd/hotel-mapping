import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getFastXSource } from '@/fastx/source';

// Phase 0 stub. Renders the raw HotelData the pipeline will consume so the
// data-source layer can be inspected end-to-end. The classification
// workbench, OTA-style output, and before/after hero replace this view in
// later phases.

type Params = Promise<{ hotelCode: string }>;

export default async function FastXHotelPage({ params }: { params: Params }) {
  const { hotelCode } = await params;
  const source = getFastXSource();

  let hotel;
  try {
    hotel = await source.getHotelContent(decodeURIComponent(hotelCode));
  } catch {
    notFound();
  }

  const amenityCount = hotel.allAmenities?.edges.length ?? 0;
  const cardCount = hotel.cardTypes?.length ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 space-y-8">
      <div className="space-y-2">
        <Link
          href="/fastx"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All demo hotels
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          {hotel.hotelName ?? hotel.hotelCode}
        </h1>
        <p className="text-xs font-mono text-muted-foreground">
          {hotel.hotelCode}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <Stat label="Amenity nodes" value={amenityCount} />
        <Stat label="Card types" value={cardCount} />
        <Stat label="Descriptions" value={hotel.descriptions?.length ?? 0} />
        <Stat label="External mappings" value={hotel.mappings?.length ?? 0} />
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Raw HotelData
        </p>
        <pre className="overflow-auto text-xs leading-relaxed text-foreground">
          {JSON.stringify(hotel, null, 2)}
        </pre>
      </div>

      <div className="flex gap-3">
        <Link
          href="/fastx"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Back
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2">
      <p className="text-2xl font-extrabold tabular-nums text-foreground">
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
