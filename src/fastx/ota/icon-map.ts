// Concrete icon map handed to the client-side FacilitiesSection.
// Lives in its own file so server callers can import the LucideIcon
// values without dragging React into the prepare-view module.

import type { LucideIcon } from 'lucide-react';
import {
  CATEGORY_ICONS,
  BUCKET_ICONS,
} from '../taxonomy-icons';

export const FACILITIES_ICON_MAP: Record<string, LucideIcon> = {
  Wifi: CATEGORY_ICONS.internet,
  Waves: CATEGORY_ICONS.pools,
  Sparkles: CATEGORY_ICONS.wellness_spa,
  Utensils: CATEGORY_ICONS.food_drink,
  CarFront: CATEGORY_ICONS.transfers,
  Briefcase: CATEGORY_ICONS.business,
  Baby: CATEGORY_ICONS.family,
  Accessibility: CATEGORY_ICONS.accessibility,
  Languages: CATEGORY_ICONS.languages,
  ShieldCheck: CATEGORY_ICONS.safety_security,
  Building2: CATEGORY_ICONS.general,
  CreditCard: BUCKET_ICONS._payment,
  MapPin: BUCKET_ICONS._nearby,
};
