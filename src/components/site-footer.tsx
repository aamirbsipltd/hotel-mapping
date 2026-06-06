import Link from 'next/link';
import Image from 'next/image';
import { COMPLIANCE } from '@/lib/tripadvisor/compliance';
import { FOOTER_COPY, PRIMARY_CTA, SITE_BRAND, SITE_NAV } from '@/marketing/copy';

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-stone-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr] gap-8">
          {/* Brand + tagline */}
          <div className="flex flex-col gap-2 max-w-sm">
            <span className="font-semibold text-sm text-foreground">{SITE_BRAND.name}</span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {FOOTER_COPY.description}
            </p>
          </div>

          {/* Site nav */}
          <nav className="flex flex-col gap-2 text-sm">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70">
              Site
            </span>
            {SITE_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors w-fit"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Contact prompt — the funnel endpoint */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70">
              {FOOTER_COPY.contactHeading}
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {FOOTER_COPY.contactBody}
            </p>
            <Link
              href={PRIMARY_CTA.href}
              className="mt-1 inline-flex w-fit rounded-md border border-emerald-600 text-emerald-700 px-3 py-1.5 text-sm font-medium hover:bg-emerald-50 transition-colors"
            >
              {PRIMARY_CTA.label}
            </Link>
          </div>
        </div>

        {/* Bottom strip — copyright + Tripadvisor compliance attribution */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {SITE_BRAND.name}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{FOOTER_COPY.poweredBy}</span>
            <Image
              src={COMPLIANCE.REQUIRED_LOGO_URL}
              alt="Tripadvisor"
              width={COMPLIANCE.REQUIRED_LOGO_WIDTH}
              height={COMPLIANCE.REQUIRED_LOGO_HEIGHT}
              unoptimized
            />
            <span className="text-xs text-muted-foreground">{FOOTER_COPY.contentApi}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
