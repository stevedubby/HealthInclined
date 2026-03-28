"use client";

export default function AdminLogoutButton() {
  return (
    <button
      type="button"
      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-transparent dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        window.location.href = "/admin/login";
      }}
    >
      Log out
    </button>
  );
}
