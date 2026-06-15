"use server";
import { createAdminClient as createClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { BookingStatus } from "@/types";
import { sendTelegramNotification } from "@/lib/telegram";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { translateSupabaseError } from "@/lib/utils";

// Превращаем технический отказ триггера вместимости в понятный текст
function capacityError(message: string): Error {
  return new Error(message.includes("CAPACITY_FULL") ? translateSupabaseError(message) : message);
}

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
  if (error) throw capacityError(error.message);
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

export async function addGalleryItem(url: string, alt: string, sortOrder: number) {
  await requireAdmin();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("gallery")
    .insert({ url, alt, sort_order: sortOrder })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  return data;
}

export async function deleteGalleryItem(id: string, url: string) {
  await requireAdmin();
  const supabase = createClient();
  const marker = "/object/public/gallery/";
  const idx = url.indexOf(marker);
  const path = idx !== -1 ? url.slice(idx + marker.length) : null;
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

export async function updateCapacity(zone: string, capacity: number) {
  await requireAdmin();
  if (!Number.isInteger(capacity) || capacity < 0) throw new Error("Некорректное число мест");
  const supabase = createClient();
  const { error } = await supabase.from("capacity_zones").update({ capacity }).eq("zone", zone);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings");
}

type RegisteredClientBooking = {
  mode: "registered";
  user_id: string;
  pet_id: string;
  service_type: "daycare" | "hotel";
  daycare_format: string | null;
  start_date: string;
  end_date: string | null;
  notes: string | null;
};

type GuestClientBooking = {
  mode: "guest";
  guest_name: string;
  guest_phone: string | null;
  guest_pet_name: string;
  guest_pet_type: "dog" | "cat";
  guest_pet_breed: string | null;
  guest_pet_weight: number | null;
  service_type: "daycare" | "hotel";
  daycare_format: string | null;
  start_date: string;
  end_date: string | null;
  notes: string | null;
};

export async function createBookingForClient(data: RegisteredClientBooking | GuestClientBooking) {
  await requireAdmin();
  const supabase = createClient();

  let clientName = "";
  let clientPhone = "";
  let petName = "";
  let petType = "";
  let emailTarget: string | null = null;

  if (data.mode === "registered") {
    const [{ data: profile }, { data: pet }] = await Promise.all([
      supabase.from("profiles").select("full_name, phone, email").eq("id", data.user_id).single(),
      supabase.from("pets").select("name, type").eq("id", data.pet_id).single(),
    ]);
    clientName = profile?.full_name ?? "";
    clientPhone = profile?.phone ?? "";
    petName = pet?.name ?? "";
    petType = pet?.type ?? "";
    emailTarget = profile?.email ?? null;

    const { error } = await supabase.from("bookings").insert({
      user_id: data.user_id,
      pet_id: data.pet_id,
      service_type: data.service_type,
      daycare_format: data.daycare_format,
      start_date: data.start_date,
      end_date: data.end_date,
      notes: data.notes,
      status: "confirmed",
    });
    if (error) throw capacityError(error.message);
  } else {
    clientName = data.guest_name;
    clientPhone = data.guest_phone ?? "";
    petName = data.guest_pet_name;
    petType = data.guest_pet_type;

    const { error } = await supabase.from("bookings").insert({
      guest_name: data.guest_name,
      guest_phone: data.guest_phone,
      guest_pet_name: data.guest_pet_name,
      guest_pet_type: data.guest_pet_type,
      guest_pet_breed: data.guest_pet_breed,
      guest_pet_weight: data.guest_pet_weight,
      service_type: data.service_type,
      daycare_format: data.daycare_format,
      start_date: data.start_date,
      end_date: data.end_date,
      notes: data.notes,
      status: "confirmed",
    });
    if (error) throw capacityError(error.message);
  }

  const serviceLabel = data.service_type === "hotel" ? "🏨 Гостиница" : "🐾 Детский сад";
  const dateInfo = data.end_date ? `${data.start_date} → ${data.end_date}` : data.start_date;
  const clientInfo = clientName
    ? `👤 ${clientName}${clientPhone ? ` · ${clientPhone}` : ""}\n`
    : "";
  const guestMark = data.mode === "guest" ? " <i>(без регистрации)</i>" : "";

  await sendTelegramNotification(
    `✅ <b>Запись создана (admin)</b>${guestMark}\n\n` +
    `${serviceLabel}\n` +
    clientInfo +
    `🐶 ${petType === "dog" ? "Собака" : "Кошка"} ${petName}\n` +
    `📅 ${dateInfo}` +
    (data.notes ? `\n💬 ${data.notes}` : "") +
    `\n\n<i>Подробности — в админпанели</i>`
  );

  if (emailTarget && data.mode === "registered") {
    await sendBookingConfirmationEmail({
      to: emailTarget,
      petName,
      serviceType: data.service_type,
      daycareFormat: data.daycare_format,
      startDate: data.start_date,
      endDate: data.end_date,
    });
  }

  revalidatePath("/admin/daycare/bookings");
  revalidatePath("/admin/hotel/bookings");
  revalidatePath("/admin/calendar");
}
