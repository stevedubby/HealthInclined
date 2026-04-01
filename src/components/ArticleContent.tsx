import { generateHTML } from "@tiptap/html";
import MarkdownContent from "@/components/MarkdownContent";
import { getArticleExtensions, isTiptapJsonContent } from "@/lib/tiptap-article";

/**
 * Renders stored article body: TipTap JSON (primary) or legacy Markdown.
 */
export default function ArticleContent({ content }: { content: string }) {
  if (isTiptapJsonContent(content)) {
    try {
      const doc = JSON.parse(content) as Parameters<typeof generateHTML>[0];
      const html = generateHTML(doc, getArticleExtensions());
      return (
        <div
          className="article-tiptap max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } catch {
      return (
        <p className="text-sm text-red-600 dark:text-red-400">
          This article could not be rendered. Please re-save it from the admin editor.
        </p>
      );
    }
  }

  return <MarkdownContent markdown={content} />;
}
