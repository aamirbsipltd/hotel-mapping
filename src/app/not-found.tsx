import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center space-y-5">
      <p className="text-5xl font-extrabold text-muted-foreground/30">404</p>
      <h1 className="text-xl font-semibold text-foreground">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        The page or session you are looking for does not exist, or may have expired after 30 days.
      </p>
      <div className="flex gap-3 justify-center pt-2">
        <Link href="/" className={cn(buttonVariants({ variant: 'outline' }))}>
          Go home
        </Link>
        <Link href="/upload" className={cn(buttonVariants())}>
          New mapping
        </Link>
      </div>
    </div>
  );
}
