export const SITE = {
  name: "Healthinclined",
  domain: "healthinclined.com",
  baseUrl: "https://healthinclined.com",
  tagline: "Simple health education about everyday body symptoms.",
  // Keep messaging calm and non-diagnostic.
  trustLine:
    "Healthinclined shares practical, everyday education. It’s not medical diagnosis.",

  /** Set `CONTACT_EMAIL` in `.env.local` (falls back if unset). */
  contactEmail:
    (typeof process !== "undefined" && process.env.CONTACT_EMAIL?.trim()) ||
    "you@example.com",

  /**
   * Replace `#` with your profile URLs when ready.
   * Example: "https://www.youtube.com/@yourchannel"
   */
  socialLinks: {
    youtube: "#",
    instagram: "#",
    tiktok: "#",
    facebook: "#",
  } as const,
};

