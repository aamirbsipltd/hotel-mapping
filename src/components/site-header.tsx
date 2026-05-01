import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-semibold text-sm tracking-tight text-foreground">
            Hotel Mapping Tool
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/pricing" className="hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="/about" className="hover:text-foreground transition-colors">
            About
          </Link>
          <Link
            href="/upload"
            className="rounded-md bg-primary text-primary-foreground px-4 py-1.5 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Try free
          </Link>
        </nav>
      </div>
    </header>
  );
}
