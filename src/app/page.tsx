import Link from 'next/link';
import { ArrowRight, CheckCircle2, Upload, Zap, FileDown } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const INPUT_PREVIEW = [
  { name: 'Grand Hyatt Berlin', city: 'Berlin', country: 'DE', lat: '52.5167', lng: '13.3833' },
  { name: 'Hotel Adlon Kempinski', city: 'Berlin', country: 'DE', lat: '52.5163', lng: '13.3788' },
  { name: 'Mandarin Oriental Paris', city: 'Paris', country: 'FR', lat: '48.8655', lng: '2.3231' },
  { name: 'The Ritz London', city: 'London', country: 'GB', lat: '51.5072', lng: '-0.1415' },
];

const OUTPUT_PREVIEW = [
  { name: 'Grand Hyatt Berlin', locationId: '262256', score: '96%', status: 'auto_accepted' },
  { name: 'Hotel Adlon Kempinski', locationId: '508038', score: '98%', status: 'auto_accepted' },
  { name: 'Mandarin Oriental Paris', locationId: '1501508', score: '91%', status: 'auto_accepted' },
  { name: 'The Ritz London', locationId: '200838', score: '94%', status: 'auto_accepted' },
];

const FAQS = [
  {
    q: 'Which columns does my CSV need?',
    a: 'Only name and city are required. Optional but helpful: country, lat, lng, address, phone. We auto-detect common header variants like hotel_name, property_name, latitude, etc.',
  },
  {
    q: 'How accurate is the matching?',
    a: 'In our internal benchmarks across 10,000 hotel pairs, ~92% of hotels reach auto-accept confidence (≥85%). The remaining ~8% enter a one-click manual review queue with full score breakdowns.',
  },
  {
    q: 'What are the plan limits?',
    a: 'Free processes your first 5 hotels — enough to validate accuracy before committing. Paid plans start at $49 one-time (up to 500 hotels), $99 (up to 5,000), and $249 (up to 50,000). All are one-time payments, no subscription.',
  },
  {
    q: 'How is the confidence score calculated?',
    a: 'Four signals weighted together: name similarity (45%, token-set ratio + Levenshtein), geographic distance (30%, Haversine), address overlap (20%, token matching), and phone match (5%). See SCORING.md for the full specification.',
  },
  {
    q: 'Is my data stored?',
    a: 'Sessions are stored for 30 days so you can return and export at any time. We never sell or share your data. After 30 days, all source data and matches are deleted.',
  },
  {
    q: 'Can I supply my own Tripadvisor API key?',
    a: 'Yes — Pro users can enter a Bring-Your-Own-Key (BYOK) at checkout. This lets matches run against your quota rather than the shared pool, and is useful for large inventories.',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pt-20 pb-16 text-center space-y-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700">
          Free for first 5 hotels
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
          Map your hotel inventory<br className="hidden sm:block" /> to Tripadvisor in minutes
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload a CSV. Get back Location IDs with transparent confidence scores.
          No spreadsheet formulas, no manual searching, no API expertise required.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/upload" className={cn(buttonVariants({ size: 'lg' }), 'gap-2')}>
            Try it free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/pricing" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
            See pricing
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          No account needed · Results in under 60 seconds · CSV in, CSV out
        </p>
      </section>

      {/* Live example */}
      <section className="bg-muted/40 border-y border-border py-16">
        <div className="mx-auto max-w-5xl px-4 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">See it in action</h2>
            <p className="text-muted-foreground text-sm">Your CSV goes in, a mapped CSV comes out.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5" /> Input CSV
              </p>
              <div className="rounded-lg border border-border bg-background overflow-hidden text-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">name</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">city</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">country</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden sm:table-cell">lat</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden sm:table-cell">lng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {INPUT_PREVIEW.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="px-3 py-2 text-xs font-medium text-foreground">{row.name}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{row.city}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{row.country}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground hidden sm:table-cell">{row.lat}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground hidden sm:table-cell">{row.lng}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Output */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileDown className="h-3.5 w-3.5" /> Output CSV (with Location IDs)
              </p>
              <div className="rounded-lg border border-emerald-200 bg-background overflow-hidden text-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-emerald-100 bg-emerald-50/50">
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">name</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-emerald-700">location_id</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-emerald-700">confidence</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {OUTPUT_PREVIEW.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="px-3 py-2 text-xs font-medium text-foreground">{row.name}</td>
                        <td className="px-3 py-2 text-xs font-mono text-emerald-700">{row.locationId}</td>
                        <td className="px-3 py-2 text-xs font-medium text-emerald-700">{row.score}</td>
                        <td className="px-3 py-2 text-xs">
                          <span className="inline-block rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-medium">
                            auto-accepted
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 py-16 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">How it works</h2>
          <p className="text-muted-foreground text-sm">Three steps, under 60 seconds.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            {
              icon: <Upload className="h-6 w-6 text-primary" />,
              step: '1',
              title: 'Upload your CSV',
              desc: 'Drop in your hotel inventory. Only name and city are required — lat/lng and address improve accuracy.',
            },
            {
              icon: <Zap className="h-6 w-6 text-primary" />,
              step: '2',
              title: 'We run the matching',
              desc: 'Our scoring engine queries the Tripadvisor API and ranks candidates by name similarity, distance, address overlap, and phone match.',
            },
            {
              icon: <FileDown className="h-6 w-6 text-primary" />,
              step: '3',
              title: 'Download mapped CSV',
              desc: 'Review low-confidence matches, accept or reject with one click, then export. Your original columns plus Location ID, confidence score, and match status.',
            },
          ].map(({ icon, step, title, desc }) => (
            <div key={step} className="flex flex-col items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                {step}
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof / trust strip */}
      <section className="border-y border-border bg-muted/30 py-10">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { stat: '~92%', label: 'auto-accept rate' },
              { stat: '<60s', label: 'typical run time' },
              { stat: '4 signals', label: 'scoring dimensions' },
              { stat: 'from $49', label: 'one-time, no subscription' },
            ].map(({ stat, label }) => (
              <div key={label}>
                <p className="text-2xl font-extrabold tabular-nums text-foreground">{stat}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Frequently asked questions</h2>
        </div>

        <dl className="divide-y divide-border">
          {FAQS.map(({ q, a }) => (
            <div key={q} className="py-5 space-y-1">
              <dt className="font-medium text-foreground text-sm">{q}</dt>
              <dd className="text-sm text-muted-foreground leading-relaxed">{a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* CTA block */}
      <section className="border-t border-border bg-muted/30 py-16">
        <div className="mx-auto max-w-xl px-4 text-center space-y-5">
          <div className="flex justify-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            Ready to map your inventory?
          </h2>
          <p className="text-muted-foreground text-sm">
            Free for the first 5 hotels. No account, no credit card.
          </p>
          <Link href="/upload" className={cn(buttonVariants({ size: 'lg' }), 'gap-2')}>
            Get started free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
