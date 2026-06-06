// Server-side view preparer. Walks the canonical ClassifyResult and
// resolves bilingual labels eagerly so the client toggle does nothing
// beyond reading the pre-built object — no classification on locale
// flip, no re-derivation.

import type { ClassifyResult } from '../classify/types';
import { ORDERED_CATEGORY_IDS, type CategoryId } from '../taxonomy';
import { categoryLabel, amenityLabel, bucketLabel } from '../demo/labels';
import type {
  ChipView,
  CategoryCardView,
  BucketBlockView,
  FacilitiesView,
} from './facilities-section';

// Icon mapping is by string name — the client component is given a
// concrete LucideIcon map at render time. This way the server can hand
// over JSON-safe data and never serialises React components.
const CATEGORY_ICON_NAMES: Record<CategoryId, string> = {
  internet: 'Wifi',
  pools: 'Waves',
  wellness_spa: 'Sparkles',
  food_drink: 'Utensils',
  transfers: 'CarFront',
  business: 'Briefcase',
  family: 'Baby',
  accessibility: 'Accessibility',
  languages: 'Languages',
  safety_security: 'ShieldCheck',
  general: 'Building2',
};

const BUCKET_ICON_NAMES = {
  _payment: 'CreditCard',
  _nearby: 'MapPin',
} as const;

export function prepareFacilitiesView(result: ClassifyResult): FacilitiesView {
  const categories: CategoryCardView[] = [];
  for (const id of ORDERED_CATEGORY_IDS) {
    const items = result.categories[id];
    if (!items || items.length === 0) continue;
    const chips: ChipView[] = items.map((item, i) => ({
      id: `${id}-${i}`,
      en: amenityLabel(item, 'en'),
      de: amenityLabel(item, 'de'),
    }));
    categories.push({
      id,
      iconName: CATEGORY_ICON_NAMES[id],
      labels: {
        en: categoryLabel(id, 'en'),
        de: categoryLabel(id, 'de'),
      },
      chips,
    });
  }

  const payment: BucketBlockView | null =
    result.payment.length > 0
      ? {
          id: '_payment',
          iconName: BUCKET_ICON_NAMES._payment,
          labels: {
            en: bucketLabel('_payment', 'en'),
            de: bucketLabel('_payment', 'de'),
          },
          chips: result.payment.map((item, i) => ({
            id: `_payment-${i}`,
            en: amenityLabel(item, 'en'),
            de: amenityLabel(item, 'de'),
          })),
        }
      : null;

  const nearby: BucketBlockView | null =
    result.nearby.length > 0
      ? {
          id: '_nearby',
          iconName: BUCKET_ICON_NAMES._nearby,
          labels: {
            en: bucketLabel('_nearby', 'en'),
            de: bucketLabel('_nearby', 'de'),
          },
          chips: result.nearby.map((item, i) => ({
            id: `_nearby-${i}`,
            en: amenityLabel(item, 'en'),
            de: amenityLabel(item, 'de'),
          })),
        }
      : null;

  return { categories, payment, nearby };
}
