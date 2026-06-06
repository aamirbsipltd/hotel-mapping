import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { HOW_IT_WORKS_STUB } from '@/marketing/copy';

export const metadata = {
  title: 'How it works — Hotel Mapping Tool',
  description:
    'How the done-for-you content operations process works: you send us your supplier feed, we return clean, located, enriched hotel content.',
};

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 space-y-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
        {HOW_IT_WORKS_STUB.eyebrow}
      </p>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
        {HOW_IT_WORKS_STUB.headline}
      </h1>
      <p className="text-base text-muted-foreground leading-relaxed">
        {HOW_IT_WORKS_STUB.body}
      </p>
      <div className="pt-2">
        <Link
          href={HOW_IT_WORKS_STUB.cta.href}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 text-white px-5 py-2.5 text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          {HOW_IT_WORKS_STUB.cta.label}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
