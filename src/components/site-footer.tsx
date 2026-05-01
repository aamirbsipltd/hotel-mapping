import Link from 'next/link';
import Image from 'next/image';

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-stone-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-sm text-foreground">Hotel Mapping Tool</span>
            <p className="text-xs text-muted-foreground max-w-xs">
              The fastest path from your hotel inventory to Tripadvisor Location IDs.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </nav>
        </div>
        <div className="mt-8 pt-6 border-t border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Hotel Mapping Tool
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Powered by</span>
            <Image
              src="https://static.tacdn.com/img2/branding/tripadvisor_logo_115x18.png"
              alt="Tripadvisor"
              width={115}
              height={18}
              unoptimized
            />
            <span className="text-xs text-muted-foreground">Content API</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
