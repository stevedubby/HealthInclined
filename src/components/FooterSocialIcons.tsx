import type { ReactNode } from "react";

type Props = {
  youtube: string;
  instagram: string;
  tiktok: string;
  facebook: string;
};

const iconClass =
  "h-5 w-5 fill-current text-zinc-600 transition hover:text-emerald-700 dark:text-zinc-400 dark:hover:text-emerald-400";

export default function FooterSocialIcons({ youtube, instagram, tiktok, facebook }: Props) {
  const items: Array<{
    href: string;
    label: string;
    children: ReactNode;
  }> = [
    {
      href: youtube,
      label: "YouTube",
      children: (
        <svg className={iconClass} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1 31.4 31.4 0 0 0 .5-5.8 31.4 31.4 0 0 0-.5-5.8zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
        </svg>
      ),
    },
    {
      href: instagram,
      label: "Instagram",
      children: (
        <svg className={iconClass} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.9.2 2.4.4.6.2 1 .5 1.5 1 .4.4.7.9.9 1.5.2.5.3 1.2.4 2.4.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.9-.4 2.4-.2.6-.5 1-1 1.5-.4.4-.9.7-1.5.9-.5.2-1.2.3-2.4.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.9-.2-2.4-.4-.6-.2-1-.5-1.5-1-.4-.4-.7-.9-.9-1.5-.2-.5-.3-1.2-.4-2.4-.1-1.3-.1-1.7-.1-4.9s0-3.6.1-4.9c.1-1.2.2-1.9.4-2.4.2-.6.5-1 1-1.5.4-.4.9-.7 1.5-.9.5-.2 1.2-.3 2.4-.4 1.3-.1 1.7-.1 4.9-.1zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.3.8-.4.4-.6.8-.8 1.3-.2.4-.3 1-.4 2.1-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.3.4.4.8.6 1.3.8.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.3-.8.4-.4.6-.8.8-1.3.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.8-1.3-.4-.4-.8-.6-1.3-.8-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1zm0 3.3a5.7 5.7 0 1 1 0 11.4 5.7 5.7 0 0 1 0-11.4zm0 1.8a3.9 3.9 0 1 0 0 7.8 3.9 3.9 0 0 0 0-7.8zm6.2-4.1a1.3 1.3 0 1 1-2.6 0 1.3 1.3 0 0 1 2.6 0z" />
        </svg>
      ),
    },
    {
      href: tiktok,
      label: "TikTok",
      children: (
        <svg className={iconClass} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25v-.74h-3.45v13.54a2.9 2.9 0 1 1-2.1-2.77v-3.5a6.37 6.37 0 0 0-1 .07 6.33 6.33 0 1 0 6.33 6.33V8.37a8.9 8.9 0 0 0 5.99 2.32v-3.7a4.85 4.85 0 0 1-1-.3z" />
        </svg>
      ),
    },
    {
      href: facebook,
      label: "Facebook",
      children: (
        <svg className={iconClass} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07c0 5.52 3.66 10.2 8.75 11.86V15.6H6.1V12h2.65V9.36c0-2.6 1.55-4.04 3.93-4.04 1.14 0 2.33.2 2.33.2v2.57h-1.31c-1.3 0-1.7.8-1.7 1.62V12h2.9l-.46 3.6h-2.44v8.33C20.34 22.27 24 17.6 24 12.07z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {items.map(({ href, label, children }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-100 bg-white text-zinc-700 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-zinc-900 dark:hover:border-emerald-700 dark:hover:bg-zinc-800"
        >
          {children}
        </a>
      ))}
    </div>
  );
}
