import Link from "next/link";
import { SITE } from "@/lib/site";
import FooterSocialIcons from "@/components/FooterSocialIcons";

export default function SiteFooter() {
  const { socialLinks } = SITE;

  return (
    <footer className="mt-16 border-t border-emerald-100 bg-white dark:border-emerald-900 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{SITE.name}</div>
            <p className="mt-2 max-w-prose text-sm leading-6 text-zinc-600 dark:text-zinc-400">{SITE.trustLine}</p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <Link className="text-sm font-semibold text-zinc-700 hover:text-emerald-800 dark:text-zinc-300 dark:hover:text-emerald-300" href="/blog">
              Blog
            </Link>
            <Link className="text-sm font-semibold text-zinc-700 hover:text-emerald-800 dark:text-zinc-300 dark:hover:text-emerald-300" href="/videos">
              Videos
            </Link>
            <Link className="text-sm font-semibold text-zinc-700 hover:text-emerald-800 dark:text-zinc-300 dark:hover:text-emerald-300" href="/about">
              About
            </Link>
            <Link className="text-sm font-semibold text-zinc-700 hover:text-emerald-800 dark:text-zinc-300 dark:hover:text-emerald-300" href="/terms">
              Terms of Service
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-6 border-t border-emerald-100 pt-8 dark:border-emerald-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Contact
            </div>
            <a
              href={`mailto:${SITE.contactEmail}`}
              className="mt-1 inline-block text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
            >
              {SITE.contactEmail}
            </a>
          </div>

          <FooterSocialIcons
            youtube={socialLinks.youtube}
            instagram={socialLinks.instagram}
            tiktok={socialLinks.tiktok}
            facebook={socialLinks.facebook}
          />
        </div>
      </div>
    </footer>
  );
}

