"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendTelegramNotification } from "@/lib/telegram";
import { isBookingOpenFor, BOOKING_OPENS_LABEL } from "@/lib/booking-config";
import type { DayAvailability } from "@/types";

// Доступность по датам для выбранной услуги и вида питомца.
// Детсад → одна дата; гостиница → ночи [start, end).
export async function getAvailability(params: {
  service_type: "daycare" | "hotel";
  pet_type: "dog" | "cat";
  start_date: string;
  end_date: string | null;
}): Promise<DayAvailability[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_availability", {
    p_service: params.service_type,
    p_pet_type: params.pet_type,
    p_start: params.start_date,
    p_end: params.end_date,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as DayAvailability[];
}

// Доступность зоны по каждому дню диапазона (для календаря в форме брони).
export async function getMonthAvailability(params: {
  service_type: "daycare" | "hotel";
  pet_type: "dog" | "cat";
  start_date: string;
  end_date: string;
}): Promise<DayAvailability[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_range_availability", {
    p_service: params.service_type,
    p_pet_type: params.pet_type,
    p_start: params.start_date,
    p_end: params.end_date,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as DayAvailability[];
}

export async function submitClientBooking(data: {
  pet_id: string;
  service_type: "daycare" | "hotel";
  daycare_format: string | null;
  start_date: string;
  end_date: string | null;
  notes: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Проверяем что питомец принадлежит пользователю
  const { data: pet } = await supabase
    .from("pets")
    .select("id, name, type, owner_id")
    .eq("id", data.pet_id)
    .eq("owner_id", user.id)
    .single();
  if (!pet) throw new Error("Питомец не найден");

  const petType = pet.type as "dog" | "cat";
  if (!isBookingOpenFor(petType)) {
    throw new Error(`Бронь для ${petType === "cat" ? "кошек" : "собак"} откроется ${BOOKING_OPENS_LABEL[petType]}`);
  }

  // Мягкая проверка свободных мест (дружелюбная ошибка) — по уже подтверждённым броням.
  // Место фактически резервируется триггером вместимости в момент, когда админ подтвердит заявку.
  const availability = await getAvailability({
    service_type: data.service_type,
    pet_type: pet.type as "dog" | "cat",
    start_date: data.start_date,
    end_date: data.end_date,
  });
  const full = availability.find((day) => day.remaining <= 0);
  if (full) throw new Error(`CAPACITY_FULL|${full.d}|`);

  // Заявка уходит на ручное подтверждение админом (звонок клиенту) — status "pending".
  const { data: createdBooking, error } = await supabase
    .from("bookings")
    .insert({
      ...data,
      user_id: user.id,
      status: "pending",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const serviceLabel = data.service_type === "hotel" ? "🏨 Гостиница" : "🐾 Детский сад";
  const dateInfo = data.end_date
    ? `${data.start_date} → ${data.end_date}`
    : data.start_date;

  // Без ПДн: имена, телефоны, клички и комментарии в Telegram не отправляем —
  // серверы Telegram за пределами РФ (трансграничная передача, ст. 12 152-ФЗ).
  await sendTelegramNotification(
    `🆕 <b>Новая заявка #${createdBooking.id.slice(0, 8)}</b> (клиентская, ждёт подтверждения)\n\n` +
    `${serviceLabel}\n` +
    `📅 ${dateInfo}\n\n` +
    `<i>Позвоните клиенту и подтвердите в админпанели</i>`
  );

  // Email-подтверждение не отправляется (Resend удалён — 152-ФЗ, трансграничка).
  // Клиент видит статус заявки в личном кабинете сразу после оформления.

  revalidatePath("/cabinet/bookings");
}
