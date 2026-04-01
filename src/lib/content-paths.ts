import path from "node:path";

function normalizeDir(input: string): string {
  return input.replace(/[\\/]+$/, "");
}

export function getBundledContentRoot(): string {
  return path.join(process.cwd(), "content");
}

export function getWritableContentRoot(): string {
  const envDir = process.env.CONTENT_DATA_DIR?.trim();
  if (envDir) {
    return normalizeDir(envDir);
  }
  if (process.env.VERCEL) {
    // Vercel runtime filesystem is read-only except /tmp.
    return "/tmp/content";
  }
  return getBundledContentRoot();
}

export function getReadContentRoots(): string[] {
  const writable = getWritableContentRoot();
  const bundled = getBundledContentRoot();
  return writable === bundled ? [bundled] : [writable, bundled];
}
