// Server-side preparer for the before/after hero.
//
// Resolves both locales eagerly for every triaged RawItem so the hero's
// client toggle is free. Counts come straight from the result.stats —
// no separate tally; if the snapshot's stats trip the invariant it
// would already have thrown at classify time.

import type { ClassifyResult } from '../classify/types';
import { amenityLabel } from '../demo/labels';
import { prepareFacilitiesView } from './prepare-view';
import type { HeroProps, RawListItem } from './before-after-hero';

export function prepareHero(args: {
  hotelName: string;
  hotelCode: string;
  result: ClassifyResult;
}): HeroProps {
  const { result } = args;
  const rawList: RawListItem[] = result.all.map((item, i) => ({
    id: `${item.sourceField}-${i}`,
    sourceField: item.sourceField,
    bucket: classify(item.routing, item.resolvedCategory),
    en: amenityLabel(item, 'en'),
    de: amenityLabel(item, 'de'),
  }));
  const view = prepareFacilitiesView(result);
  return {
    hotelName: args.hotelName,
    hotelCode: args.hotelCode,
    rawList,
    view,
    counts: {
      total: result.stats.total,
      auto: result.stats.auto,
      review: result.stats.review,
      payment: result.stats.payment,
      nearby: result.stats.nearby,
      excluded: result.stats.excluded,
    },
  };
}

function classify(
  routing: 'auto' | 'review' | 'excluded',
  bucket: string | null,
): RawListItem['bucket'] {
  if (routing === 'auto') return 'auto';
  if (routing === 'review') return 'review';
  if (bucket === '_payment') return 'payment';
  if (bucket === '_nearby') return 'nearby';
  return 'excluded';
}
