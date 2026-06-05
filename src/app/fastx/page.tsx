import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getFastXSource } from '@/fastx/source';

export const metadata = {
  title: 'FastX Amenities Classifier — Hotel Mapping Tool',
  description:
    'Classify Travelgate FastX hotel amenities into a clean OTA-style taxonomy with EN/DE labels, separated payment and nearby blocks, and a human-in-the-loop review queue.',
};

export default async function FastXPage() {
  const source = getFastXSource();
  const hotels = await source.listAvailable();

  return (
    <div className="flex flex-col">
      <section className="mx-auto max-w-5xl px-4 pt-20 pb-12 text-center space-y-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700">
          <Sparkles className="h-3 w-3" /> FastX amenities classifier
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
          Turn a messy Travelgate feed<br className="hidden sm:block" />
          into a clean OTA facilities page
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Genuine amenities classified into a canonical taxonomy. Payment cards
          and nearby landmarks routed out. Bilingual EN/DE output. A review
          queue for the edge cases.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20 space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Demo hotels</h2>
          <p className="text-sm text-muted-foreground">
            Two representative FastX content fixtures. Pick one to run the
            classifier — the result is the OTA-style facilities section a
            traveller would actually see.
          </p>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {hotels.map((h) => (
            <li
              key={h.hotelCode}
              className="rounded-lg border border-border bg-background p-5 flex flex-col gap-3"
            >
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{h.hotelName}</p>
                <p className="text-xs font-mono text-muted-foreground">
                  {h.hotelCode}
                </p>
              </div>
              <div className="mt-auto">
                <Link
                  href={`/fastx/${encodeURIComponent(h.hotelCode)}`}
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    'gap-1.5',
                  )}
                >
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </li>
          ))}
        </ul>

        <p className="text-xs text-muted-foreground">
          Classification pipeline, OTA output, and the before/after demo hero
          land in the next phases. Phase 0 only wires the route shell, source
          adapter, and fixtures.
        </p>
      </section>
    </div>
  );
}
