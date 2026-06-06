import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CONTACT_STUB } from '@/marketing/copy';

export const metadata = {
  title: 'Contact — Hotel Mapping Tool',
  description:
    'Talk to us about your supplier feed. Done-for-you content operations on top of Travelgate FastX, Google Places, and the polygon-driven region engine.',
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 space-y-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
        {CONTACT_STUB.eyebrow}
      </p>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
        {CONTACT_STUB.headline}
      </h1>
      <p className="text-base text-muted-foreground leading-relaxed">
        {CONTACT_STUB.body}
      </p>
      <div className="pt-2">
        <Link
          href="/platform"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          See the live demo in the meantime
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
