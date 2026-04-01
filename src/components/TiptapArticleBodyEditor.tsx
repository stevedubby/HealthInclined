"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { useCallback, useEffect, useRef } from "react";
import { getArticleExtensions } from "@/lib/tiptap-article";

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-500/60 dark:bg-emerald-950/50 dark:text-emerald-100"
          : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}

export default function TiptapArticleBodyEditor({
  initialDocJson,
  onChange,
}: {
  initialDocJson: string;
  onChange: (json: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadImageRef = useRef<(file: File) => Promise<void>>(async () => {});

  const editor = useEditor({
    immediatelyRender: false,
    extensions: getArticleExtensions({
      placeholder: "Start writing your article… Paste links to make them clickable.",
    }),
    content: JSON.parse(initialDocJson),
    editorProps: {
      attributes: {
        class:
          "tiptap-editor-root focus:outline-none min-h-[420px] px-1 py-2 text-[17px] leading-relaxed text-zinc-900 dark:text-zinc-100",
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) void uploadImageRef.current(file);
            return true;
          }
        }
        return false;
      },
      handleDrop: (_view, event, _slice, moved) => {
        if (moved) return false;
        const file = event.dataTransfer?.files?.[0];
        if (file?.type.startsWith("image/")) {
          event.preventDefault();
          void uploadImageRef.current(file);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(JSON.stringify(ed.getJSON()));
    },
  });

  const insertImageFromFile = useCallback(
    async (file: File) => {
      if (!editor || !file.type.startsWith("image/")) return;

      let src: string | null = null;
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: form });
        if (res.ok) {
          const data = (await res.json()) as { url?: string };
          if (data.url) src = data.url;
        }
      } catch {
        /* fall through to data URL */
      }

      if (!src) {
        src = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.onerror = () => reject(new Error("Could not read image"));
          r.readAsDataURL(file);
        });
      }

      editor.chain().focus().setImage({ src }).run();
    },
    [editor],
  );

  useEffect(() => {
    uploadImageRef.current = insertImageFromFile;
  }, [insertImageFromFile]);

  const runLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    const trimmed = url.trim();
    if (trimmed === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
  };

  const onPickImage = () => fileInputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void insertImageFromFile(file);
  };

  if (!editor) {
    return (
      <div className="min-h-[480px] animate-pulse rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40" />
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-950/60">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1.5 border-b border-zinc-100 bg-zinc-50/95 px-2 py-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
        <ToolbarButton
          title="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <span className="italic">I</span>
        </ToolbarButton>
        <ToolbarButton
          title="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <span className="underline">U</span>
        </ToolbarButton>
        <span className="mx-0.5 h-5 w-px bg-zinc-300 dark:bg-zinc-600" aria-hidden />
        <ToolbarButton
          title="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          title="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          title="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </ToolbarButton>
        <span className="mx-0.5 h-5 w-px bg-zinc-300 dark:bg-zinc-600" aria-hidden />
        <ToolbarButton
          title="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </ToolbarButton>
        <ToolbarButton
          title="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </ToolbarButton>
        <span className="mx-0.5 h-5 w-px bg-zinc-300 dark:bg-zinc-600" aria-hidden />
        <ToolbarButton title="Link" onClick={runLink}>
          Link
        </ToolbarButton>
        <ToolbarButton title="Insert image" onClick={onPickImage}>
          Image
        </ToolbarButton>
        <ToolbarButton
          title="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          “ ”
        </ToolbarButton>
        <ToolbarButton title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          ─
        </ToolbarButton>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      <div className="px-4 pb-6 pt-3 sm:px-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
