import type { Metadata } from "next";
import Container from "@/components/Container";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About | Healthinclined",
  description: "Learn how Healthinclined writes simple, non-diagnostic health education.",
  alternates: { canonical: `${SITE.baseUrl}/about` },
};

export default function AboutPage() {
  return (
    <Container>
      <div className="pt-8 sm:pt-12">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          About Healthinclined
        </h1>

        <div className="mt-6 rounded-3xl border border-emerald-100 bg-white p-6 sm:p-8 dark:border-emerald-900 dark:bg-zinc-900">
          <p className="text-base leading-7 text-zinc-700 dark:text-zinc-300">
            Healthinclined provides clear, science-backed explanations for everyday
            body symptoms &amp; Health Education, helping you understand what your body
            is signaling and practical steps you can take.
          </p>

          <h2 className="mt-8 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Our philosophy</h2>

          <ul className="mt-4 list-disc pl-5 text-base leading-7 text-zinc-700 dark:text-zinc-300">
            <li>Simplicity</li>
            <li>Clarity</li>
            <li>Helpful guidance</li>
            <li>Education-first content</li>
          </ul>

          <p className="mt-6 text-base leading-7 text-zinc-700 dark:text-zinc-300">
            {SITE.trustLine}
          </p>

          <h2 className="mt-8 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Future-ready (optional)</h2>
          <p className="mt-3 text-base leading-7 text-zinc-700 dark:text-zinc-300">
            Email capture can be added later for readers who want reminders about new
            posts in their favorite categories.
          </p>

          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
            <div className="text-sm font-semibold text-emerald-900">Email signup placeholder</div>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              (Optional future feature) Add your email capture component here.
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
}

