import type { Metadata } from "next";
import Image from "next/image";
import Container from "@/components/Container";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About | Healthinclined",
  description:
    "Learn about Healthinclined, a structured and research-based health education platform.",
  alternates: { canonical: `${SITE.baseUrl}/about` },
};

export default function AboutPage() {
  return (
    <Container>
      <div className="pt-10 sm:pt-14">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl md:text-5xl">
          About Healthinclined
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-600 dark:text-zinc-300 sm:text-lg">
          Clear, structured health education designed to improve understanding and support
          more confident everyday decisions.
        </p>

        <div className="mt-8 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-8 md:p-10 dark:border-emerald-900 dark:bg-zinc-900">
          {/*
            Default: intro, then image above or beside “About the Creator” (not at the very bottom).
            sm+: image sits beside creator copy; md+: intro column + sticky image + creator column.
          */}
          <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-start">
            <div className="min-w-0 space-y-10">
              <section className="space-y-4">
                <p className="text-base leading-7 text-zinc-700 dark:text-zinc-300 sm:text-[1.03rem]">
                  Healthinclined is a health education platform focused on helping you
                  understand what your body is communicating-clearly, simply, and
                  without confusion.
                </p>
                <p className="text-base leading-7 text-zinc-700 dark:text-zinc-300 sm:text-[1.03rem]">
                  Everyday symptoms such as eye twitching, numbness, or changes in the
                  body are often misunderstood. This can lead to unnecessary worry,
                  misinformation, or poor decision-making.
                </p>
                <p className="text-base leading-7 text-zinc-700 dark:text-zinc-300 sm:text-[1.03rem]">
                  Healthinclined was created to provide clear, structured explanations
                  of these common experiences using widely accepted health knowledge,
                  presented in a way that is easy to follow and practical to apply.
                </p>
              </section>

              <section className="rounded-2xl border border-emerald-100/80 bg-emerald-50/20 p-5 dark:border-emerald-900 dark:bg-emerald-950/10">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  How It Works
                </h2>
                <p className="mt-3 text-base leading-7 text-zinc-700 dark:text-zinc-300">
                  Each topic is approached with a consistent framework:
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-7 text-zinc-700 dark:text-zinc-300">
                  <li>Identifying the symptom</li>
                  <li>Explaining common underlying causes</li>
                  <li>
                    Distinguishing between normal occurrences and situations that may
                    require attention
                  </li>
                  <li>Outlining practical steps that can be considered</li>
                </ul>
                <p className="mt-4 text-base leading-7 text-zinc-700 dark:text-zinc-300">
                  This structured approach allows for clearer understanding and more
                  confident decision-making.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Why Trust This Platform
                </h2>
                <p className="mt-3 text-base leading-7 text-zinc-700 dark:text-zinc-300">
                  Healthinclined is built on careful research and a commitment to
                  clarity.
                </p>
                <p className="mt-4 text-base leading-7 text-zinc-700 dark:text-zinc-300">
                  All content is grounded in general scientific understanding and
                  commonly accepted health information, simplified into accessible
                  insights without unnecessary complexity.
                </p>
                <p className="mt-4 text-base leading-7 text-zinc-700 dark:text-zinc-300">
                  The focus is not on speculation or diagnosis, but on responsible,
                  educational explanations that help users better understand their
                  bodies.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  The Approach
                </h2>
                <p className="mt-3 text-base leading-7 text-zinc-700 dark:text-zinc-300">
                  Content on Healthinclined is designed to be:
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-7 text-zinc-700 dark:text-zinc-300">
                  <li>Clear</li>
                  <li>Practical</li>
                  <li>Easy to understand</li>
                </ul>
                <p className="mt-4 text-base leading-7 text-zinc-700 dark:text-zinc-300">
                  The objective is to make reliable health information more accessible,
                  while maintaining a calm and responsible tone.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Platform Structure
                </h2>
                <p className="mt-3 text-base leading-7 text-zinc-700 dark:text-zinc-300">
                  Healthinclined operates as a blog-first platform, where each topic is
                  explained in detail and supported by short-form content for broader
                  accessibility and engagement.
                </p>
              </section>
            </div>

            <div className="grid gap-6 sm:grid-cols-[minmax(0,13rem)_1fr] sm:items-start md:contents">
              <aside className="mx-auto w-full max-w-sm sm:mx-0 sm:max-w-none md:sticky md:top-24 md:row-span-2 md:self-start">
                <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-md shadow-emerald-100/40 dark:border-emerald-900 dark:bg-zinc-900 dark:shadow-none">
                  <Image
                    src="/myaboutimage.jpeg"
                    alt="About the creator of Healthinclined"
                    width={900}
                    height={1100}
                    className="h-auto w-full max-h-[min(68vh,560px)] object-cover object-top md:max-h-none"
                    priority
                  />
                </div>
              </aside>

              <div className="min-w-0 space-y-8 md:col-start-1">
                <section>
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    About the Creator
                  </h2>
                  <p className="mt-3 text-base leading-7 text-zinc-700 dark:text-zinc-300">
                    Healthinclined is developed and maintained by an independent health
                    researcher with a strong focus on studying body patterns, simplifying
                    health information, and making practical knowledge more accessible.
                  </p>
                  <p className="mt-4 text-base leading-7 text-zinc-700 dark:text-zinc-300">
                    In addition to Healthinclined, other niche-focused platforms have
                    been developed within the health space, including RecoveryHunt, which
                    focuses specifically on smoker-related health and recovery.
                  </p>
                  <p className="mt-5 text-base font-semibold leading-7 text-zinc-900 dark:text-zinc-100">
                    - Ejianya Chidubem Steven
                  </p>
                </section>

                <section className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    Note
                  </h2>
                  <p className="mt-2 text-base leading-7 text-zinc-700 dark:text-zinc-300">
                    Content on this platform is provided for educational purposes only
                    and should not be considered a substitute for professional medical
                    advice.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}

