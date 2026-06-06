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
  // Tripadvisor decommissioned the old static.tacdn.com/img2/branding/...
  // path in 2026 (301 → tripadvisor.com → 404). The current served asset
  // is the same 115×18 PNG under the cdsi/ versioned path on the main
  // tripadvisor.com origin. If this 404s again, probe with curl -I and
  // pick the next versioned filename Tripadvisor exposes.
  REQUIRED_LOGO_URL:
    'https://www.tripadvisor.com/img/cdsi/img2/branding/tripadvisor_logo_115x18-18034-2.png',
  REQUIRED_LOGO_WIDTH: 115,
  REQUIRED_LOGO_HEIGHT: 18,
  REQUIRED_LINK_LABEL: 'Read reviews on Tripadvisor',
} as const;

export function isComplianceReady(loc: {
  rating_image_url?: string;
  web_url?: string;
}): boolean {
  return !!loc.rating_image_url && !!loc.web_url;
}
