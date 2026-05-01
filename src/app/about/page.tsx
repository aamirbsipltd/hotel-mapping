import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 space-y-10">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">About</h1>
        <p className="text-muted-foreground leading-relaxed">
          Hotel Mapping Tool is a focused utility for hospitality data teams. It solves one problem
          well: reliably mapping your hotel identifiers to Tripadvisor Location IDs so your
          inventory can surface ratings, review counts, and web URLs.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Why we built this</h2>
        <p className="text-muted-foreground leading-relaxed">
          Mapping hotel inventories is tedious. Name variants, city spellings, chain prefixes —
          any of these can throw off a string match. A manual lookup of a 500-hotel inventory
          takes days. An unmaintained fuzzy-match script takes weeks to tune.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Our scoring engine combines four signals — name similarity, geographic proximity,
          address overlap, and phone match — with weights calibrated on real hotel data.
          High-confidence matches are accepted automatically. Edge cases surface in a one-click
          review queue with a full breakdown of every signal so you can make an informed decision,
          not a blind one.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Data and privacy</h2>
        <p className="text-muted-foreground leading-relaxed">
          We store sessions for 30 days so you can return and export at any time. We do not
          sell your data, share it with third parties, or use it to train models. After 30 days
          all source rows and match results are deleted automatically.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Tripadvisor ratings and review counts are fetched live via the Tripadvisor Content API
          and cached for 24 hours per location, in compliance with Tripadvisor&apos;s display guidelines.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Scoring transparency</h2>
        <p className="text-muted-foreground leading-relaxed">
          Every match shows you exactly how its confidence score was composed — name similarity
          percentage, distance in kilometres, address token overlap, and phone match result.
          The full scoring specification is published in{' '}
          <a
            href="https://github.com/hotelmappingtool/scoring"
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            SCORING.md
          </a>.
        </p>
      </div>

      <div className="border-t border-border pt-8 flex gap-3">
        <Link href="/upload" className={cn(buttonVariants())}>
          Try it free
        </Link>
        <Link href="/pricing" className={cn(buttonVariants({ variant: 'outline' }))}>
          See pricing
        </Link>
      </div>
    </div>
  );
}
