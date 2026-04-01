import fs from "node:fs";
import path from "node:path";
import { dbGetCategories, dbUpsertCategories, isDatabaseEnabled } from "@/lib/db-content";
import { getReadContentRoots, getWritableContentRoot } from "@/lib/content-paths";

export type Category = {
  slug: string;
  name: string;
  shortDescription: string;
  highlight?: boolean;
};

function getCategoriesFilePathWritable(): string {
  return path.join(getWritableContentRoot(), "categories.json");
}

function getCategoriesReadPaths(): string[] {
  return getReadContentRoots().map((root) => path.join(root, "categories.json"));
}

export const DEFAULT_CATEGORIES: Category[] = [
  {
    slug: "body-signals",
    name: "Why Your Body Does This",
    shortDescription: "Core body-signal explanations for everyday symptoms.",
    highlight: true,
  },
  {
    slug: "sleep",
    name: "Sleep",
    shortDescription: "Snoring, fatigue, and sleep issues that affect how you feel.",
  },
  {
    slug: "nerves-circulation",
    name: "Nerves & Circulation",
    shortDescription: "Pins & needles, numbness, and nerve comfort tips.",
  },
  {
    slug: "daily-health",
    name: "Daily Health",
    shortDescription: "Hydration, urine color, and small habits you can track.",
  },
  {
    slug: "myths",
    name: "Myths",
    shortDescription: "Everyday misconceptions—what's true and what's not.",
  },
];

function isValidCategoryRecord(x: unknown): x is Category {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.slug === "string" &&
    o.slug.length > 0 &&
    typeof o.name === "string" &&
    o.name.length > 0 &&
    typeof o.shortDescription === "string" &&
    (o.highlight === undefined || typeof o.highlight === "boolean")
  );
}

function parseCategoriesFile(raw: string): Category[] | null {
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data) || data.length === 0) return null;
    const out: Category[] = [];
    const slugs = new Set<string>();
    for (const item of data) {
      if (!isValidCategoryRecord(item)) return null;
      if (slugs.has(item.slug)) return null;
      slugs.add(item.slug);
      out.push({
        slug: item.slug,
        name: item.name,
        shortDescription: item.shortDescription,
        highlight: item.highlight,
      });
    }
    return out;
  } catch {
    return null;
  }
}

/** Categories for the public site and admin — read from `content/categories.json` with fallback. */
export function getCategories(): Category[] {
  throw new Error("Use getCategoriesAsync() instead.");
}

export async function getCategoriesAsync(): Promise<Category[]> {
  const readFromFiles = (): Category[] => {
    try {
      for (const filePath of getCategoriesReadPaths()) {
        if (!fs.existsSync(filePath)) continue;
        const raw = fs.readFileSync(filePath, "utf8");
        const parsed = parseCategoriesFile(raw);
        if (parsed) return parsed;
      }
      return DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  };

  if (isDatabaseEnabled()) {
    const dbCategories = await dbGetCategories();
    if (dbCategories.length > 0) return dbCategories;
    const seeded = readFromFiles();
    await dbUpsertCategories(seeded);
    return seeded;
  }
  return readFromFiles();
}

export async function getCategoryBySlugAsync(slug: string): Promise<Category | null> {
  const categories = await getCategoriesAsync();
  return categories.find((c) => c.slug === slug) ?? null;
}

export function getCategoriesFilePath(): string {
  return getCategoriesFilePathWritable();
}

export function writeCategoriesFile(categories: Category[]): void {
  const target = getCategoriesFilePathWritable();
  const dir = path.dirname(target);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(categories, null, 2)}\n`, "utf8");
}

export async function saveCategoriesAsync(categories: Category[]): Promise<void> {
  if (isDatabaseEnabled()) {
    await dbUpsertCategories(categories);
    return;
  }
  writeCategoriesFile(categories);
}
