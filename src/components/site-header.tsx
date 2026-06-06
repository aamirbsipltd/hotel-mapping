import Link from 'next/link';
import { PRIMARY_CTA, SITE_BRAND, SITE_NAV } from '@/marketing/copy';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="font-semibold text-sm tracking-tight text-foreground">
            {SITE_BRAND.name}
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-5 text-sm text-muted-foreground">
          {SITE_NAV.filter((item) => item.href !== '/').map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href={PRIMARY_CTA.href}
          className="rounded-md bg-emerald-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-emerald-700 transition-colors shrink-0"
        >
          {PRIMARY_CTA.label}
        </Link>
      </div>
    </header>
  );
}
