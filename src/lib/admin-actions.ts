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
  price_total: number | null;
  // Детсад: несколько дат за раз — одна бронь на дату. Если задано, start_date игнорируется.
  daycare_dates?: string[] | null;
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
  price_total: number | null;
  daycare_dates?: string[] | null;
};

export type CreateBookingResult = {
  created: number;
  failed: { date: string; reason: string }[];
};

export async function createBookingForClient(
  data: RegisteredClientBooking | GuestClientBooking
): Promise<CreateBookingResult> {
  await requireAdmin();
  const supabase = createClient();

  // Профиль/питомец нужны только для письма клиенту — в Telegram ПДн не идут.
  let petName = "";
  let emailTarget: string | null = null;

  if (data.mode === "registered") {
    const [{ data: profile }, { data: pet }] = await Promise.all([
      supabase.from("profiles").select("email").eq("id", data.user_id).single(),
      supabase.from("pets").select("name").eq("id", data.pet_id).single(),
    ]);
    petName = pet?.name ?? "";
    emailTarget = profile?.email ?? null;
  } else {
    petName = data.guest_pet_name;
  }

  // Базовые поля клиента/питомца (общие для всех создаваемых записей)
  const clientFields = data.mode === "registered"
    ? { user_id: data.user_id, pet_id: data.pet_id }
    : {
        guest_name: data.guest_name,
        guest_phone: data.guest_phone,
        guest_pet_name: data.guest_pet_name,
        guest_pet_type: data.guest_pet_type,
        guest_pet_breed: data.guest_pet_breed,
        guest_pet_weight: data.guest_pet_weight,
      };

  // Детсад с мультивыбором → одна бронь на каждую дату. Иначе — одна запись.
  const dates = data.service_type === "daycare" && data.daycare_dates && data.daycare_dates.length > 0
    ? [...data.daycare_dates].sort()
    : [data.start_date];

  const failed: { date: string; reason: string }[] = [];
  const createdIds: string[] = [];
  let created = 0;

  for (const d of dates) {
    const { data: ins, error } = await supabase
      .from("bookings")
      .insert({
        ...clientFields,
        service_type: data.service_type,
        daycare_format: data.daycare_format,
        start_date: d,
        end_date: data.service_type === "hotel" ? data.end_date : null,
        notes: data.notes,
        price_total: data.price_total,
        status: "confirmed",
      })
      .select("id")
      .single();
    if (error) {
      failed.push({ date: d, reason: capacityError(error.message).message });
    } else {
      created++;
      if (ins) createdIds.push(ins.id);
    }
  }

  // Если ни одна не создалась — это ошибка (поведение как у одиночной брони)
  if (created === 0) {
    throw new Error(failed[0]?.reason ?? "Не удалось создать запись");
  }

  const serviceLabel = data.service_type === "hotel" ? "🏨 Гостиница" : "🐾 Детский сад";
  // Для мультидат показываем список созданных дат, иначе обычная дата/период
  const createdDates = dates.filter((d) => !failed.some((f) => f.date === d));
  const dateInfo = data.service_type === "hotel" && data.end_date
    ? `${data.start_date} → ${data.end_date}`
    : createdDates.length > 1
      ? `${createdDates.length} дн.: ${createdDates.join(", ")}`
      : createdDates[0] ?? data.start_date;
  const idsInfo = createdIds.map((id) => `#${id.slice(0, 8)}`).join(", ");
  const priceInfo = data.price_total ? `\n💰 ${data.price_total.toLocaleString("ru-RU")} ₽${createdDates.length > 1 ? "/день" : ""}` : "";
  const failedInfo = failed.length > 0 ? `\n⚠️ Не прошли по местам: ${failed.map((f) => f.date).join(", ")}` : "";

  // Без ПДн: имена, телефоны, клички и комментарии в Telegram не отправляем —
  // серверы Telegram за пределами РФ (трансграничная передача, ст. 12 152-ФЗ).
  await sendTelegramNotification(
    `✅ <b>Новая бронь ${idsInfo}</b> (${data.mode === "guest" ? "гостевая" : "клиентская"}, создана админом)\n\n` +
    `${serviceLabel}\n` +
    `📅 ${dateInfo}` +
    priceInfo +
    failedInfo +
    `\n\n<i>Детали — в админпанели</i>`
  );

  if (emailTarget && data.mode === "registered") {
    await sendBookingConfirmationEmail({
      to: emailTarget,
      petName,
      serviceType: data.service_type,
      daycareFormat: data.daycare_format,
      startDate: createdDates[0] ?? data.start_date,
      endDate: data.end_date,
    });
  }

  revalidatePath("/admin/daycare/bookings");
  revalidatePath("/admin/hotel/bookings");
  revalidatePath("/admin/calendar");

  return { created, failed };
}
