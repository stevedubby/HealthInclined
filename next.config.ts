import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * When `www` is added in Vercel + DNS (CNAME), send everyone to the apex URL.
   * Fixes bookmarks and links that use www; no browser or network filtering.
   */
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.healthinclined.com" }],
        destination: "https://healthinclined.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
