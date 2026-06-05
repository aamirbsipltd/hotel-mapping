// Lucide icon bindings for the FastX taxonomy.
//
// Split out from `taxonomy.ts` so the pure taxonomy can be imported from
// server-only / Node-test contexts without dragging React in. The /fastx
// page imports from this file when it needs an icon.

import type { LucideIcon } from 'lucide-react';
import {
  Wifi,
  Waves,
  Sparkles,
  Utensils,
  CarFront,
  Briefcase,
  Baby,
  Accessibility,
  Languages,
  ShieldCheck,
  Building2,
  CreditCard,
  MapPin,
  Trash2,
} from 'lucide-react';
import { CATEGORIES, type BucketId, type CategoryId } from './taxonomy';

export const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  internet: Wifi,
  pools: Waves,
  wellness_spa: Sparkles,
  food_drink: Utensils,
  transfers: CarFront,
  business: Briefcase,
  family: Baby,
  accessibility: Accessibility,
  languages: Languages,
  safety_security: ShieldCheck,
  general: Building2,
};

export const BUCKET_ICONS: Record<'_payment' | '_nearby' | '_excluded', LucideIcon> = {
  _payment: CreditCard,
  _nearby: MapPin,
  _excluded: Trash2,
};

export function bucketIcon(id: BucketId): LucideIcon {
  if (id in CATEGORIES) return CATEGORY_ICONS[id as CategoryId];
  return BUCKET_ICONS[id as '_payment' | '_nearby' | '_excluded'];
}
