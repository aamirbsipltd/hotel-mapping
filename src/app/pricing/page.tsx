import Link from 'next/link';
import { Check, X, ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    description: 'Try it on a sample of your inventory. No account, no credit card.',
    hotelLimit: '5 hotels',
    cta: 'Try free',
    ctaHref: '/upload',
    highlighted: false,
    features: {
      hotels: '5 hotels',
      export: true,
      breakdown: true,
      review: true,
      watermark: 'Watermarked',
      byok: false,
      support: false,
    },
  },
  {
    name: 'Starter',
    price: '$49',
    period: 'one-time',
    description: 'For boutique groups and small aggregators mapping up to 500 properties.',
    hotelLimit: 'Up to 500 hotels',
    cta: 'Buy Starter',
    ctaHref: '/upload',
    highlighted: false,
    features: {
      hotels: 'Up to 500',
      export: true,
      breakdown: true,
      review: true,
      watermark: 'None',
      byok: false,
      support: 'Email',
    },
  },
  {
    name: 'Pro',
    price: '$99',
    period: 'one-time',
    description: 'For travel tech teams mapping a full inventory, with BYOK for your own quota.',
    hotelLimit: 'Up to 5,000 hotels',
    cta: 'Buy Pro',
    ctaHref: '/upload',
    highlighted: true,
    features: {
      hotels: 'Up to 5,000',
      export: true,
      breakdown: true,
      review: true,
      watermark: 'None',
      byok: true,
      support: 'Email',
    },
  },
  {
    name: 'Business',
    price: '$249',
    period: 'one-time',
    description: 'For OTAs and wholesalers with large inventories and re-mapping needs.',
    hotelLimit: 'Up to 50,000 hotels',
    cta: 'Buy Business',
    ctaHref: '/upload',
    highlighted: false,
    features: {
      hotels: 'Up to 50,000',
      export: true,
      breakdown: true,
      review: true,
      watermark: 'None',
      byok: true,
      support: 'Priority email',
    },
  },
];

const FEATURE_ROWS: { key: keyof typeof PLANS[0]['features']; label: string }[] = [
  { key: 'hotels', label: 'Hotels per session' },
  { key: 'export', label: 'CSV export' },
  { key: 'breakdown', label: 'Score breakdown per match' },
  { key: 'review', label: 'Manual review queue' },
  { key: 'watermark', label: 'Export watermark' },
  { key: 'byok', label: 'Bring your own TA API key' },
  { key: 'support', label: 'Support' },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="h-4 w-4 text-emerald-600 mx-auto" />;
  if (value === false) return <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />;
  return <span className="text-sm text-foreground">{value}</span>;
}

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 space-y-14">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Pricing</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          One-time payments — no subscription, no renewal. Pay once, run as many sessions as you need within your limit. Sessions are retained for 30 days.
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              'rounded-xl border p-5 flex flex-col gap-4',
              plan.highlighted
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border bg-background',
            )}
          >
            {plan.highlighted && (
              <span className="self-start rounded-full bg-primary text-primary-foreground px-2.5 py-0.5 text-xs font-semibold">
                Most popular
              </span>
            )}
            <div>
              <p className="font-semibold text-foreground">{plan.name}</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
                {plan.period && (
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{plan.description}</p>
            </div>
            <Link
              href={plan.ctaHref}
              className={cn(
                buttonVariants({ variant: plan.highlighted ? 'default' : 'outline', size: 'sm' }),
                'w-full gap-1.5 mt-auto',
              )}
            >
              {plan.cta} {plan.highlighted && <ArrowRight className="h-3.5 w-3.5" />}
            </Link>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div className="rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground w-1/3">Feature</th>
              {PLANS.map((p) => (
                <th
                  key={p.name}
                  className={cn(
                    'px-4 py-3 font-semibold text-center',
                    p.highlighted ? 'text-primary bg-primary/5' : 'text-foreground',
                  )}
                >
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURE_ROWS.map(({ key, label }, i) => (
              <tr
                key={key}
                className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}
              >
                <td className="px-4 py-3 text-muted-foreground">{label}</td>
                {PLANS.map((p) => (
                  <td
                    key={p.name}
                    className={cn('px-4 py-3 text-center', p.highlighted && 'bg-primary/5')}
                  >
                    <Cell value={p.features[key]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Context: vs competitors */}
      <div className="rounded-xl border border-border bg-muted/30 px-6 py-6 space-y-3">
        <h2 className="font-semibold text-foreground">How we compare</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Enterprise hotel mapping platforms (GIATA, Vervotech, Gimmonix) start at{' '}
          <strong className="text-foreground">$399/month</strong> and require sales calls and minimum
          commitments. The alternative is building directly on the Tripadvisor Content API — free,
          but with no confidence scoring, no review queue, and engineering time to build the workflow.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Hotel Mapping Tool sits between those two options: purpose-built for Tripadvisor ID mapping,
          instant access, no recurring cost. Built for travel tech teams and boutique aggregators who
          need clean, confident data without a six-month vendor onboarding.
        </p>
      </div>

      {/* FAQ strip */}
      <div className="space-y-5">
        <h2 className="text-lg font-semibold text-foreground">Common questions</h2>
        <dl className="divide-y divide-border">
          {[
            {
              q: 'What counts as one hotel?',
              a: 'One row in your input CSV. The limit applies per session — you can run multiple sessions.',
            },
            {
              q: 'Can I upgrade mid-session?',
              a: 'If your session hits the demo cap, you can start a new paid session with the full CSV. Existing demo sessions are not upgraded retroactively.',
            },
            {
              q: 'Do I need a Tripadvisor API key?',
              a: 'No — we supply the API quota. Starter, Pro, and Business tiers can optionally bring their own key (BYOK) to run against their own quota instead.',
            },
            {
              q: 'What if I need more than 50,000 hotels?',
              a: "Email us at hello@hotelmappingtool.com. We'll sort out a volume arrangement.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="py-4 space-y-1">
              <dt className="font-medium text-foreground text-sm">{q}</dt>
              <dd className="text-sm text-muted-foreground">{a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
