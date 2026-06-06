import { preparePlatformPage } from '@/platform/ui/prepare-page';
import PlatformWalkthrough from '@/platform/ui/walkthrough';

export const metadata = {
  title: 'Platform — One feed in, clean located enriched content out',
  description:
    'End-to-end walkthrough: one supplier feed identified, located, and classified into a clean OTA-style content page. Done-for-you services on representative fixtures.',
};

export default function PlatformPage() {
  // Pure server-side render of the orchestrated view. No DB, no live
  // adapters, no recompute — everything below is the
  // PlatformHotelView the integration test pins.
  const page = preparePlatformPage();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PlatformWalkthrough page={page} />
    </div>
  );
}
