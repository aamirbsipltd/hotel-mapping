import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getFastXSource } from '@/fastx/source';
import { getHeadlineClassification } from '@/fastx/demo/compute';
import { prepareHero } from '@/fastx/ota/prepare-hero';
import BeforeAfterHero from '@/fastx/ota/before-after-hero';

export const metadata = {
  title: 'FastX Amenities Classifier — Hotel Mapping Tool',
  description:
    'Classify Travelgate FastX hotel amenities into a clean OTA-style taxonomy with EN/DE labels, separated payment and nearby blocks, and a human-in-the-loop review queue.',
};

export default async function FastXPage() {
  const source = getFastXSource();
  const hotels = await source.listAvailable();

  // Headline demo — same deterministic pipeline result the workbench
  // would see for this fixture, prepared for server rendering with both
  // locales resolved eagerly.
  const headline = getHeadlineClassification();
  const heroProps = prepareHero({
    hotelName: headline.hotel.hotelName ?? headline.hotel.hotelCode,
    hotelCode: headline.hotel.hotelCode,
    result: headline.result,
  });

  return (
    <div className="flex flex-col">
      <section className="mx-auto max-w-5xl px-4 pt-20 pb-10 text-center space-y-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700">
          <Sparkles className="h-3 w-3" /> FastX amenities classifier
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
          Turn a messy Travelgate feed<br className="hidden sm:block" />
          into a clean OTA facilities page
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Genuine amenities classified into a canonical taxonomy. Payment cards
          and nearby landmarks routed into their own blocks. Bilingual EN/DE
          output. A review queue for the edge cases.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <BeforeAfterHero {...heroProps} />
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20 space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Demo hotels</h2>
          <p className="text-sm text-muted-foreground">
            Open one to step through the operator workbench: classify, resolve
            the review queue, watch the auto-rate move when an item is
            approved.
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
                  Open workbench <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
