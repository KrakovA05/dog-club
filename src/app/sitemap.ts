import { createClient } from "@/lib/supabase/server";
import type { MetadataRoute } from "next";

const BASE = "https://dogclub-kaluga.ru";

const staticPages: MetadataRoute.Sitemap = [
  { url: BASE, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
  { url: `${BASE}/daycare`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
  { url: `${BASE}/hotel`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
  { url: `${BASE}/prices`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE}/contacts`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE}/gallery`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
  { url: `${BASE}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  { url: `${BASE}/booking`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = await createClient();
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, updated_at")
      .eq("is_published", true);

    const blogPages: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
      url: `${BASE}/blog/${post.slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: "monthly",
      priority: 0.6,
    }));

    return [...staticPages, ...blogPages];
  } catch {
    return staticPages;
  }
}
