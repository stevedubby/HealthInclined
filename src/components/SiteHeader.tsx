import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";

const NAV = [
  { href: "/blog", label: "Blog" },
  { href: "/videos", label: "Videos" },
  { href: "/about", label: "About" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/80 backdrop-blur dark:border-emerald-900 dark:bg-zinc-950/85">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60]"
      >
        Skip to content
      </a>

      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="group inline-flex items-center gap-3">
            <Image
              src="/myhealthinclinedlogo.png"
              alt="Healthinclined logo"
              width={40}
              height={40}
              priority
              className="h-10 w-10 rounded-full object-cover ring-1 ring-emerald-200 dark:ring-emerald-800"
            />
            <span className="text-lg font-extrabold tracking-tight text-emerald-900 group-hover:underline dark:text-emerald-300">
              Healthinclined
            </span>
            <span className="text-xs font-semibold text-emerald-700">
              powered by recoveryhunt.com
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-zinc-800 hover:text-emerald-800 hover:underline underline-offset-4 dark:text-zinc-200 dark:hover:text-emerald-300"
            >
              {item.label}
            </Link>
          ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

