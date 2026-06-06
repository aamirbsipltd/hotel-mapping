import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CAPABILITIES_STUB } from '@/marketing/copy';

export const metadata = {
  title: 'Capabilities — Hotel Mapping Tool',
  description:
    'Region mapping, content normalisation, and hotel matching — the three capabilities of the done-for-you service, each with a live demo.',
};

export default function CapabilitiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 space-y-8 text-center">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
          {CAPABILITIES_STUB.eyebrow}
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {CAPABILITIES_STUB.headline}
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
          {CAPABILITIES_STUB.body}
        </p>
      </div>
      <ul className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
        {CAPABILITIES_STUB.links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              {link.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
