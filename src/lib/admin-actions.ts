"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { BookingStatus } from "@/types";

export async function updateBookingStatus(id: string, status: BookingStatus) {
  const supabase = await createClient();
  await supabase.from("bookings").update({ status }).eq("id", id);
  revalidatePath("/admin/daycare/bookings");
  revalidatePath("/admin/hotel/bookings");
}

export async function updateBookingPrice(id: string, price: number) {
  const supabase = await createClient();
  await supabase.from("bookings").update({ price_total: price }).eq("id", id);
  revalidatePath("/admin/daycare/bookings");
  revalidatePath("/admin/hotel/bookings");
}

export async function upsertPrice(data: {
  id?: string; service_type: string; label: string;
  description: string; price: number; unit: string;
  is_featured: boolean; sort_order: number;
}) {
  const supabase = await createClient();
  if (data.id) {
    await supabase.from("prices").update(data).eq("id", data.id);
  } else {
    await supabase.from("prices").insert(data);
  }
  revalidatePath("/admin/daycare/prices");
  revalidatePath("/admin/hotel/prices");
  revalidatePath("/prices");
}

export async function deletePrice(id: string) {
  const supabase = await createClient();
  await supabase.from("prices").delete().eq("id", id);
  revalidatePath("/admin/daycare/prices");
  revalidatePath("/admin/hotel/prices");
  revalidatePath("/prices");
}

export async function upsertFaq(data: {
  id?: string; question: string; answer: string; sort_order: number;
}) {
  const supabase = await createClient();
  if (data.id) {
    await supabase.from("faq").update(data).eq("id", data.id);
  } else {
    await supabase.from("faq").insert(data);
  }
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
}

export async function deleteFaq(id: string) {
  const supabase = await createClient();
  await supabase.from("faq").delete().eq("id", id);
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
}

export async function setReviewPublished(id: string, published: boolean) {
  const supabase = await createClient();
  await supabase.from("reviews").update({ is_published: published }).eq("id", id);
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}

export async function deleteReview(id: string) {
  const supabase = await createClient();
  await supabase.from("reviews").delete().eq("id", id);
  revalidatePath("/admin/reviews");
}

export async function deleteGalleryItem(id: string, url: string) {
  const supabase = await createClient();
  const path = url.split("/gallery/")[1];
  if (path) await supabase.storage.from("gallery").remove([path]);
  await supabase.from("gallery").delete().eq("id", id);
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}

export async function upsertBlogPost(data: {
  id?: string; slug: string; title: string; excerpt: string;
  content: string; cover_url: string; is_published: boolean;
}) {
  const supabase = await createClient();
  const payload = {
    ...data,
    published_at: data.is_published ? new Date().toISOString() : null,
  };
  if (data.id) {
    await supabase.from("blog_posts").update(payload).eq("id", data.id);
  } else {
    await supabase.from("blog_posts").insert(payload);
  }
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

export async function deleteBlogPost(id: string) {
  const supabase = await createClient();
  await supabase.from("blog_posts").delete().eq("id", id);
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}
