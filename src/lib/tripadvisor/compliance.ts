/**
 * Tripadvisor display rules (summary):
 *   - Use Tripadvisor's bubble rating image (rating_image_url), never custom stars.
 *   - Display "Tripadvisor" wordmark or owl logo adjacent to every rating.
 *   - Link back to the Tripadvisor page (web_url) for every hotel shown.
 *   - Cache rating data max 24 hours.
 *   - Do not modify or filter ratings.
 *   - Do not store reviews longer than 24 hours.
 *
 * Full rules: https://www.tripadvisor.com/developers
 */
export const COMPLIANCE = {
  CACHE_TTL_HOURS: 24,
  REQUIRED_LOGO_URL: 'https://static.tacdn.com/img2/branding/tripadvisor_logo_115x18.png',
  REQUIRED_LINK_LABEL: 'Read reviews on Tripadvisor',
} as const;

export function isComplianceReady(loc: {
  rating_image_url?: string;
  web_url?: string;
}): boolean {
  return !!loc.rating_image_url && !!loc.web_url;
}
