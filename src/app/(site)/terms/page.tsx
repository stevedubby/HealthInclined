import type { Metadata } from "next";
import Container from "@/components/Container";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service | Healthinclined",
  description: "Terms of Service for Healthinclined.",
  alternates: { canonical: `${SITE.baseUrl}/terms` },
};

export default function TermsPage() {
  return (
    <Container>
      <div className="pt-8 sm:pt-12">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          Terms of Service
        </h1>

        <div className="mt-6 rounded-3xl border border-emerald-100 bg-white p-6 sm:p-8 dark:border-emerald-900 dark:bg-zinc-900">
          <p className="text-base leading-7 text-zinc-700 dark:text-zinc-300">
            By using Healthinclined, you agree to use this website for informational
            purposes only.
          </p>
          <p className="mt-4 text-base leading-7 text-zinc-700 dark:text-zinc-300">
            Content on this site is educational and does not replace medical advice,
            diagnosis, or treatment.
          </p>
          <p className="mt-4 text-base leading-7 text-zinc-700 dark:text-zinc-300">
            We may update these terms over time. Continued use of the site means you
            accept the updated terms.
          </p>
        </div>
      </div>
    </Container>
  );
}

