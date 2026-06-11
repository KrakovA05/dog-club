import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/client";
import type { ReviewRow, PriceRow, BlogPost } from "@/types";

// Клиент без cookie-сессии — только для публичных данных
function getPublicClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Рейтинги отзывов для счётчика в Hero
export const getPublishedReviewRatings = unstable_cache(
  async () => {
    const { data } = await getPublicClient()
      .from("reviews")
      .select("rating")
      .eq("is_published", true);
    return (data ?? []) as Pick<ReviewRow, "rating">[];
  },
  ["published-review-ratings"],
  { revalidate: 3600 }
);

// Полные отзывы для слайдера
export const getPublishedReviews = unstable_cache(
  async () => {
    const { data } = await getPublicClient()
      .from("reviews")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(6);
    return (data ?? []) as ReviewRow[];
  },
  ["published-reviews"],
  { revalidate: 3600 }
);

// Цены для ServicesPreview
export const getPublicPrices = unstable_cache(
  async () => {
    const { data } = await getPublicClient()
      .from("prices")
      .select("service_type, label, price");
    return (data ?? []) as Pick<PriceRow, "service_type" | "label" | "price">[];
  },
  ["public-prices"],
  { revalidate: 3600 }
);

// Последние статьи блога для BlogTeaser
export const getLatestBlogPosts = unstable_cache(
  async () => {
    const { data } = await getPublicClient()
      .from("blog_posts")
      .select("id, slug, title, excerpt, cover_url, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(2);
    return (data ?? []) as Partial<BlogPost>[];
  },
  ["latest-blog-posts"],
  { revalidate: 1800 }
);
