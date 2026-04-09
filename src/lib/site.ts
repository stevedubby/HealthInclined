export const SITE = {
  name: "Healthinclined",
  domain: "healthinclined.com",
  /** Canonical site URL (matches Vercel primary host when apex redirects to www). */
  baseUrl: "https://www.healthinclined.com",
  tagline: "Simple health education about everyday body symptoms.",
  /** Short line for the site footer. */
  footerTagline: "Simple, research-based explanations for everyday health symptoms.",
  // Keep messaging calm and non-diagnostic.
  trustLine:
    "Healthinclined shares practical, everyday education. It’s not medical diagnosis.",

  /** Set `CONTACT_EMAIL` in `.env.local` (falls back if unset). */
  contactEmail:
    (typeof process !== "undefined" && process.env.CONTACT_EMAIL?.trim()) ||
    "contacthealthinclined@gmail.com",

  socialLinks: {
    youtube: "https://www.youtube.com/@healthinclined",
    instagram: "https://www.instagram.com/healthinclinedvigo/",
    tiktok: "https://www.tiktok.com/@healthinclined",
    facebook:
      "https://www.facebook.com/share/14cwR8pmHFh/?mibextid=wwXIfr",
  } as const,
};

