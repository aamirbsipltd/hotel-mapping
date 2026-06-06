import Link from 'next/link';
import { ArrowRight, MapPin, Sparkles, Star, CheckCircle2 } from 'lucide-react';
import { HOME_COPY } from '@/marketing/copy';

export const metadata = {
  title: 'Hotel Mapping Tool — Done-for-you hotel content operations',
  description:
    'A done-for-you service for OTAs already wired into Travelgate FastX. We take your raw supplier feed and return clean, located, enriched hotel content — region-mapped, amenities normalised, matched against Google Places.',
};

const CAPABILITY_ICONS = [MapPin, Sparkles, Star];

export default function HomePage() {
  const capabilities = HOME_COPY.capabilities;
  const credibility = HOME_COPY.credibility;

  return (
    <div className="flex flex-col">
      {/* Hero ------------------------------------------------------------ */}
      <section className="mx-auto max-w-5xl px-4 pt-20 pb-16 text-center space-y-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700">
          {HOME_COPY.hero.eyebrow}
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight max-w-4xl mx-auto">
          {HOME_COPY.hero.headline}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {HOME_COPY.hero.sub}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href={HOME_COPY.hero.primaryCta.href}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 text-white px-5 py-2.5 text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            {HOME_COPY.hero.primaryCta.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={HOME_COPY.hero.secondaryCta.href}
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            {HOME_COPY.hero.secondaryCta.label}
          </Link>
        </div>
      </section>

      {/* Capabilities ---------------------------------------------------- */}
      <section className="bg-muted/40 border-y border-border py-16">
        <div className="mx-auto max-w-5xl px-4 space-y-10">
          <div className="text-center space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              {HOME_COPY.capabilitiesIntro.eyebrow}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {HOME_COPY.capabilitiesIntro.headline}
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {HOME_COPY.capabilitiesIntro.body}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {capabilities.map((cap, i) => {
              const Icon = CAPABILITY_ICONS[i] ?? Sparkles;
              return (
                <article
                  key={cap.id}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-background p-5"
                >
                  <span className="grid place-items-center size-9 rounded-md bg-emerald-50 text-emerald-700 shrink-0">
                    <Icon className="size-5" />
                  </span>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground">{cap.title}</h3>
                    <p className="text-xs text-emerald-700 font-medium">{cap.tagline}</p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{cap.body}</p>
                  <Link
                    href={cap.demo.href}
                    className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-900"
                  >
                    {cap.demo.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Credibility — what you can verify, today ------------------------ */}
      <section className="mx-auto max-w-5xl px-4 py-16 space-y-10">
        <div className="text-center space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            {credibility.eyebrow}
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            {credibility.headline}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {credibility.items.map((item) => (
            <div
              key={item.title}
              className="flex flex-col gap-2 rounded-lg border border-border bg-background p-5"
            >
              <CheckCircle2 className="size-5 text-emerald-600" />
              <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA ----------------------------------------------------- */}
      <section className="border-t border-border bg-emerald-50/40 py-16">
        <div className="mx-auto max-w-xl px-4 text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            {HOME_COPY.closing.headline}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {HOME_COPY.closing.body}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href={HOME_COPY.closing.primaryCta.href}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 text-white px-5 py-2.5 text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              {HOME_COPY.closing.primaryCta.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={HOME_COPY.closing.secondaryCta.href}
              className="inline-flex items-center justify-center rounded-md border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              {HOME_COPY.closing.secondaryCta.label}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
