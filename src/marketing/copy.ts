// Central marketing copy — single source of truth for the done-for-you
// service pages.
//
// Every string a user reads in the marketing surfaces (header, footer,
// home, capability pages, pricing, about, contact) lives here. The
// CI banned-phrase scan (src/marketing/copy.test.ts) walks this module
// and asserts none of the self-serve / checkout language slips in.
// Keeping the copy in one place is the same discipline `PLATFORM_LABELS`
// uses for /platform — extended to the rest of the marketing site.
//
// Honesty rules (per the marketing brief §5):
//   • No fabricated testimonials, client logos, "trusted by" claims.
//   • No invented metrics — only numbers true and sourceable.
//   • No fabricated team bios — placeholders for the human to fill.
//   • Demo framing stays honest — "representative demo, built against
//     real HotelX and Google Places APIs" — never "live integration."
//   • Pricing is indicative ("from $X"), never invented fixed packages.

export type NavItem = { href: string; label: string };

export const SITE_BRAND = {
  name: 'Hotel Mapping Tool',
  tagline: 'Done-for-you hotel content operations.',
};

export const SITE_NAV: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/capabilities', label: 'Capabilities' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

// Persistent CTA across every marketing page. Always points to the
// contact route — the conversion is a conversation, never a checkout.
export const PRIMARY_CTA: NavItem = { href: '/contact', label: 'Book a call' };

// ── Home page ──────────────────────────────────────────────────────────────

export const HOME_COPY = {
  hero: {
    eyebrow: 'Done-for-you hotel content operations',
    headline: 'Your supplier feed in. Clean, located, enriched content out.',
    sub: 'We take your raw multi-supplier Travelgate FastX feed and return OTA-grade hotel content — region-mapped, amenities normalised, matched against Google Places. Engineered against the real HotelX and Google Places APIs. Done on your behalf.',
    primaryCta: { href: '/platform', label: 'See the live demo' },
    secondaryCta: PRIMARY_CTA,
  },

  capabilitiesIntro: {
    eyebrow: 'What you get back',
    headline: 'Three problems, one operated service.',
    body: 'The data vendors stop at amenities. We add the polygon-driven region assignment they do not deliver, on top of the cleanup and matching they do.',
  },

  capabilities: [
    {
      id: 'region',
      title: 'Region mapping',
      tagline: 'The differentiator the data vendors do not deliver.',
      body: 'Coordinate-based, polygon-driven resort-region assignment. Hotels identified as Dubai Marina, JBR, or Palm Jumeirah — not just "Dubai" — so travellers find what they actually search for. Built with point-in-polygon over curated boundaries, with a human review queue for the overlap and edge cases.',
      demo: { href: '/regions', label: 'See the region demo' },
    },
    {
      id: 'content',
      title: 'Content normalisation',
      tagline: 'OTA-grade amenities, English and German.',
      body: 'Amenities classified into a clean taxonomy. Credit-card types and landmark POIs separated from real facilities — no more "Burj Khalifa" rendering as an amenity. Each entry rendered in English and German, with a human-in-the-loop review queue for the ambiguous cases.',
      demo: { href: '/fastx', label: 'See the content demo' },
    },
    {
      id: 'match',
      title: 'Hotel matching & enrichment',
      tagline: 'Identified against real-world properties.',
      body: 'Your inventory matched to Google Places via a four-signal scorer — name, distance, address, phone. Ratings and review counts attached to the right property. Every match surfaces its confidence; every uncertain match goes to review rather than getting a quiet pass.',
      demo: { href: '/platform', label: 'See the platform walkthrough' },
    },
  ],

  credibility: {
    eyebrow: 'What you can verify, today',
    headline: 'Demos, not claims.',
    items: [
      {
        title: 'Engineered against the real APIs',
        body: 'Travelgate HotelX content API and Google Places — not a black box on top of someone else\'s mapped database.',
      },
      {
        title: 'Live demos, not screenshots',
        body: 'The demos render the actual engine output. Counts reconcile to the source feed; zero misclassified is the engine\'s design.',
      },
      {
        title: 'Polygon-driven region assignment',
        body: 'The differentiator that does not exist off the shelf. Hand-curated boundaries, point-in-polygon at request time, review queue for the overlaps.',
      },
    ],
  },

  closing: {
    headline: 'Send us a sample export.',
    body: 'We will return a clean walkthrough on your data. Done-for-you means we operate this on your behalf — there is no console for you to learn.',
    primaryCta: PRIMARY_CTA,
    secondaryCta: { href: '/platform', label: 'See the live demo' },
  },
} as const;

// ── Footer ─────────────────────────────────────────────────────────────────

export const FOOTER_COPY = {
  tagline: SITE_BRAND.tagline,
  description:
    'A done-for-you content operations service for OTAs and travel platforms already wired into Travelgate FastX.',
  contactHeading: 'Get in touch',
  contactBody:
    'Email a test export and we will send back a clean walkthrough — the same shape the live demo shows, on your data.',
  poweredBy: 'Powered by',
  contentApi: 'Content API',
} as const;

// ── Stub pages (Phase 0 — placeholders that resolve cleanly so nav works
// before Phase 1/2 land the real content). These are not "coming soon"
// — they are minimal real pages that fill in as the real content
// ships. The honesty discipline applies here too: short, truthful,
// pointing at the live demo as the proof.

export const HOW_IT_WORKS_STUB = {
  eyebrow: 'How it works',
  headline: 'Send us your feed. We return clean content.',
  body: 'A walkthrough of the done-for-you process — what you send, what we do, what comes back — is being assembled here. In the meantime, the live demo shows the engine end-to-end on a representative hotel.',
  cta: { href: '/platform', label: 'See the live demo' },
} as const;

export const CAPABILITIES_STUB = {
  eyebrow: 'Capabilities',
  headline: 'Three problems, one operated service.',
  body: 'The deep dive on region mapping, content normalisation, and hotel matching lands here. Each capability already has a working demo you can step through today.',
  links: [
    { href: '/regions', label: 'Region mapping demo' },
    { href: '/fastx', label: 'Content normalisation demo' },
    { href: '/platform', label: 'End-to-end platform walkthrough' },
  ],
} as const;

export const CONTACT_STUB = {
  eyebrow: 'Contact',
  headline: 'Talk to us about your feed.',
  body: 'The full contact form lands here in the next iteration. In the meantime, the conversation starts the same way — send a sample export and we return a clean walkthrough.',
  cta: PRIMARY_CTA, // self-reference is fine; the real form replaces this
} as const;
