import Link from "next/link";
import { SITE } from "@/lib/site";
import FooterSocialIcons from "@/components/FooterSocialIcons";

export default function SiteFooter() {
  const year = new Date().getFullYear();
  const { socialLinks } = SITE;
  const contactHref = `mailto:${SITE.contactEmail}`;

  return (
    <footer className="mt-auto border-t border-emerald-100/80 bg-zinc-50/90 dark:border-emerald-900/50 dark:bg-zinc-900/40">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:gap-12 md:grid-cols-3 md:items-start">
          <div className="md:pr-4">
            <div className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {SITE.name}
            </div>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {SITE.footerTagline}
            </p>
          </div>

          <nav
            className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center md:justify-center sm:gap-x-8 sm:gap-y-2"
            aria-label="Footer"
          >
            <Link
              href="/"
              className="text-sm font-medium text-zinc-700 transition hover:text-emerald-800 dark:text-zinc-300 dark:hover:text-emerald-300"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-zinc-700 transition hover:text-emerald-800 dark:text-zinc-300 dark:hover:text-emerald-300"
            >
              About
            </Link>
            <a
              href={contactHref}
              className="text-sm font-medium text-zinc-700 transition hover:text-emerald-800 dark:text-zinc-300 dark:hover:text-emerald-300"
            >
              Contact
            </a>
            <Link
              href="/terms"
              className="text-sm font-medium text-zinc-700 transition hover:text-emerald-800 dark:text-zinc-300 dark:hover:text-emerald-300"
            >
              Terms of Use
            </Link>
          </nav>

          <div className="flex justify-start md:justify-end">
            <FooterSocialIcons
              youtube={socialLinks.youtube}
              instagram={socialLinks.instagram}
              tiktok={socialLinks.tiktok}
              facebook={socialLinks.facebook}
            />
          </div>
        </div>

        <div className="mt-10 border-t border-emerald-100/70 pt-8 text-center dark:border-emerald-900/50">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            © {year} {SITE.name}. All rights reserved.
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-center text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">
            This content is for educational purposes only and not medical advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
