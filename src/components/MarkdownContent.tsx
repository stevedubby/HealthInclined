import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

export default function MarkdownContent({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2({ children }) {
          return <h2 className="mt-10 text-2xl font-semibold leading-tight text-zinc-900 dark:text-zinc-100">{children}</h2>;
        },
        h3({ children }) {
          return <h3 className="mt-8 text-xl font-semibold leading-tight text-zinc-900 dark:text-zinc-100">{children}</h3>;
        },
        p({ children }) {
          return <p className="mt-4 leading-7 text-zinc-800 dark:text-zinc-200">{children}</p>;
        },
        ul({ children }) {
          return <ul className="mt-4 list-disc pl-5 leading-7 text-zinc-800 dark:text-zinc-200">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="mt-4 list-decimal pl-5 leading-7 text-zinc-800 dark:text-zinc-200">{children}</ol>;
        },
        li({ children }) {
          return <li className="mt-1">{children}</li>;
        },
        a({ href, children }) {
          if (typeof href === "string" && href.startsWith("/")) {
            return (
              <Link href={href} className="font-medium text-emerald-700 underline underline-offset-4">
                {children}
              </Link>
            );
          }

          return (
            <a
              href={href}
              className="font-medium text-emerald-700 underline underline-offset-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          );
        },
        blockquote({ children }) {
          return (
            <blockquote className="mt-6 border-l-4 border-emerald-200 bg-emerald-50 px-4 py-2 text-zinc-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-zinc-200">
              {children}
            </blockquote>
          );
        },
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}

