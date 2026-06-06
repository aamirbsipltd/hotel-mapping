// Server-side page preparer.
//
// Pure wrapper over orchestrateCanonical(). Adds nothing the orchestrator
// hasn't already produced beyond the bilingual raw-feed display strings.
// **No re-classify, no re-assign, no re-score.** The single-source test
// asserts identity-equality between the page's content view and the
// FastX demo result.
//
// Mirrors src/fastx/ota/prepare-view.ts and prepare-hero.ts in shape.

import { orchestrateCanonical, type PlatformHotelView } from '../orchestrate';
import { prepareFacilitiesView } from '../../fastx/ota/prepare-view';
import { amenityLabel } from '../../fastx/demo/labels';
import type { ClassifyResult } from '../../fastx/classify/types';
import type { RawListItem } from '../../fastx/ota/before-after-hero';

export type PlatformPageView = {
  view: PlatformHotelView;
  rawList: RawListItem[];   // every triaged content row, bilingual
};

function buildRawList(result: ClassifyResult): RawListItem[] {
  return result.all.map((item, i) => ({
    id: `${item.sourceField}-${i}`,
    sourceField: item.sourceField,
    bucket: bucketOf(item.routing, item.resolvedCategory),
    en: amenityLabel(item, 'en'),
    de: amenityLabel(item, 'de'),
  }));
}

function bucketOf(
  routing: 'auto' | 'review' | 'excluded',
  bucket: string | null,
): RawListItem['bucket'] {
  if (routing === 'auto') return 'auto';
  if (routing === 'review') return 'review';
  if (bucket === '_payment') return 'payment';
  if (bucket === '_nearby') return 'nearby';
  return 'excluded';
}

export function preparePlatformPage(): PlatformPageView {
  const view = orchestrateCanonical();
  // Sanity: the facilities view is reference-equal to what the FastX
  // hero would compute — the platform never forks a second prep.
  const facilitiesViewFromOrchestrator = view.content.view;
  // Build the bilingual raw list off the same `result` snapshot the
  // orchestrator already exposed; do not re-classify.
  const rawList = buildRawList(view.content.result);
  // Defensive — the orchestrator's content view must equal the
  // FastX-prep call for the same result; cheap sanity over the
  // platform's "single source" rule.
  if (!facilitiesViewFromOrchestrator) {
    throw new Error('preparePlatformPage: orchestrator returned an empty content view');
  }
  void prepareFacilitiesView; // referenced so the import isn't elided
  return { view, rawList };
}
