"use server";
import { createAdminClient as createClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { BookingStatus } from "@/types";

async function requireAdmin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) throw new Error("Forbidden");
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/daycare/bookings");
  revalidatePath("/admin/hotel/bookings");
  revalidatePath("/admin/calendar");
}

export async function updateBookingPrice(id: string, price: number) {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase.from("bookings").update({ price_total: price }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/daycare/bookings");
  revalidatePath("/admin/hotel/bookings");
}

export async function upsertPrice(data: {
  id?: string; service_type: string; label: string;
  description: string; price: number; unit: string;
  is_featured: boolean; sort_order: number;
}) {
  await requireAdmin();
  const supabase = createClient();
  const { id, ...rest } = data;
  const { error } = id
    ? await supabase.from("prices").update(rest).eq("id", id)
    : await supabase.from("prices").insert(data);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/daycare/prices");
  revalidatePath("/admin/hotel/prices");
  revalidatePath("/prices");
}

export async function deletePrice(id: string) {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase.from("prices").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/daycare/prices");
  revalidatePath("/admin/hotel/prices");
  revalidatePath("/prices");
}

export async function upsertFaq(data: {
  id?: string; question: string; answer: string; sort_order: number;
}) {
  await requireAdmin();
  const supabase = createClient();
  const { id: faqId, ...faqRest } = data;
  const { error } = faqId
    ? await supabase.from("faq").update(faqRest).eq("id", faqId)
    : await supabase.from("faq").insert(data);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
}

export async function deleteFaq(id: string) {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase.from("faq").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
}

export async function setReviewPublished(id: string, published: boolean) {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase.from("reviews").update({ is_published: published }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}

export async function deleteReview(id: string) {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/reviews");
}

export async function deleteGalleryItem(id: string, url: string) {
  await requireAdmin();
  const supabase = createClient();
  const path = url.split("/gallery/")[1];
  if (path) {
    const { error: storageError } = await supabase.storage.from("gallery").remove([path]);
    if (storageError) console.error("Storage remove error:", storageError.message);
  }
  const { error } = await supabase.from("gallery").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}

export async function upsertBlogPost(data: {
  id?: string; slug: string; title: string; excerpt: string;
  content: string; cover_url: string; is_published: boolean;
}) {
  await requireAdmin();
  const supabase = createClient();

  let published_at: string | null = null;
  if (data.id) {
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("published_at")
      .eq("id", data.id)
      .single();
    if (data.is_published) {
      published_at = existing?.published_at ?? new Date().toISOString();
    } else {
      published_at = existing?.published_at ?? null;
    }
  } else if (data.is_published) {
    published_at = new Date().toISOString();
  }

  const payload = { ...data, published_at };
  const { error } = data.id
    ? await supabase.from("blog_posts").update(payload).eq("id", data.id)
    : await supabase.from("blog_posts").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

export async function deleteBlogPost(id: string) {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

export async function createBookingForClient(data: {
  user_id: string;
  pet_id: string;
  service_type: "daycare" | "hotel";
  daycare_format: string | null;
  start_date: string;
  end_date: string | null;
  notes: string | null;
}) {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase.from("bookings").insert({
    ...data,
    status: "confirmed",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/daycare/bookings");
  revalidatePath("/admin/hotel/bookings");
  revalidatePath("/admin/calendar");
}
