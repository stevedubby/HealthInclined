import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Domain redirects are handled in Vercel (e.g. apex → www).
   * Do not add a conflicting www → apex redirect here or browsers will loop
   * (307 to www, then 308 to apex, repeat).
   */
};

export default nextConfig;
