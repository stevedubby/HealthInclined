import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import SiteChrome from "@/components/SiteChrome";

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
  metadataBase: new URL("https://recoveryhunt.com"),
  title: {
    default: "Healthinclined",
    template: "%s | Healthinclined",
  },
  description:
    "Simple health education about everyday body symptoms. Clear explanations and practical, non-diagnostic guidance.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://recoveryhunt.com",
    images: [{ url: "https://recoveryhunt.com/favicon.ico" }],
  },
  twitter: {
    card: "summary",
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SiteChrome>{children}</SiteChrome>
        </ThemeProvider>
      </body>
    </html>
  );
}
