import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { getCategoriesAsync } from "@/lib/categories";
import { getAllPostsAsync } from "@/lib/content/posts";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPostsAsync();
  const urls: MetadataRoute.Sitemap = [
    { url: `${SITE.baseUrl}/`, lastModified: new Date() },
    { url: `${SITE.baseUrl}/blog`, lastModified: new Date() },
    { url: `${SITE.baseUrl}/videos`, lastModified: new Date() },
    { url: `${SITE.baseUrl}/about`, lastModified: new Date() },
  ];

  for (const c of await getCategoriesAsync()) {
    urls.push({
      url: `${SITE.baseUrl}/category/${c.slug}`,
      lastModified: new Date(),
    });
  }

  for (const p of posts) {
    urls.push({
      url: `${SITE.baseUrl}/blog/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(p.publishedAt),
    });
  }

  return urls;
}

