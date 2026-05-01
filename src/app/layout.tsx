import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Hotel Mapping Tool — Map your hotels to Tripadvisor in minutes',
  description:
    'Upload your hotel inventory CSV and get back a mapped CSV with Tripadvisor Location IDs, transparent confidence scoring, and a review queue for ambiguous matches.',
  metadataBase: new URL('https://hotelmappingtool.com'),
  openGraph: {
    title: 'Hotel Mapping Tool',
    description: 'The fastest path from your hotel inventory to Tripadvisor Location IDs.',
    url: 'https://hotelmappingtool.com',
    siteName: 'Hotel Mapping Tool',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hotel Mapping Tool',
    description: 'Map your hotel inventory to Tripadvisor Location IDs in minutes.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <Toaster />
      </body>
    </html>
  );
}
