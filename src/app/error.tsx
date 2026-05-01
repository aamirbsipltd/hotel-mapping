'use client';

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center space-y-5">
      <p className="text-5xl font-extrabold text-muted-foreground/30">!</p>
      <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        An unexpected error occurred. If the problem persists, start a new mapping session.
      </p>
      <div className="flex gap-3 justify-center pt-2">
        <button
          onClick={reset}
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Try again
        </button>
        <Link href="/upload" className={cn(buttonVariants())}>
          New mapping
        </Link>
      </div>
    </div>
  );
}
