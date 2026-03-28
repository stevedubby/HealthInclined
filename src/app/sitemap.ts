import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { getCategories } from "@/lib/categories";
import { getAllPosts } from "@/lib/content/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const urls: MetadataRoute.Sitemap = [
    { url: `${SITE.baseUrl}/`, lastModified: new Date() },
    { url: `${SITE.baseUrl}/blog`, lastModified: new Date() },
    { url: `${SITE.baseUrl}/videos`, lastModified: new Date() },
    { url: `${SITE.baseUrl}/about`, lastModified: new Date() },
  ];

  for (const c of getCategories()) {
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

