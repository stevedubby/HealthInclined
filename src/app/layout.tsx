import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import SiteChrome from "@/components/SiteChrome";
import { SITE } from "@/lib/site";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.baseUrl),
  title: {
    default: `${SITE.name} — Simple health education for everyday symptoms`,
    template: `%s | ${SITE.name}`,
  },
  applicationName: SITE.name,
  description: SITE.description,
  keywords: [
    "health education",
    "everyday symptoms",
    "wellness blog",
    "health inclined",
    "healthinclined",
    "body symptoms guide",
  ],
  alternates: {
    canonical: SITE.baseUrl,
  },
  /**
   * `src/app/icon.png` + `apple-icon.png` (from your logo) are the primary favicons for Google.
   * Keep ICO as fallback for older clients.
   */
  icons: {
    icon: [
      { url: "/myhealthinclinedlogo.png", sizes: "48x48", type: "image/png" },
      { url: "/myhealthinclinedlogo.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/myhealthinclinedlogo.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/myhealthinclinedlogo.png"],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE.baseUrl,
    siteName: SITE.name,
    title: `${SITE.name} — Everyday body symptoms, explained simply`,
    description: SITE.description,
    images: [{ url: `${SITE.baseUrl}/myhealthinclinedlogo.png`, alt: `${SITE.name} logo` }],
  },
  twitter: {
    card: "summary",
    title: `${SITE.name} — Everyday body symptoms, explained simply`,
    description: SITE.description,
    images: [`${SITE.baseUrl}/myhealthinclinedlogo.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} ${fraunces.variable} scroll-smooth`}>
      <body className="flex min-h-full flex-col bg-white font-sans text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <SiteChrome>{children}</SiteChrome>
        </ThemeProvider>
      </body>
    </html>
  );
}
