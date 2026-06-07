"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendTelegramNotification } from "@/lib/telegram";
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

  // Не даём оставить заявку на заведомо занятые даты (мягкая проверка;
  // жёсткая гарантия — триггер БД в момент подтверждения).
  const availability = await getAvailability({
    service_type: data.service_type,
    pet_type: pet.type as "dog" | "cat",
    start_date: data.start_date,
    end_date: data.end_date,
  });
  const full = availability.find((day) => day.remaining <= 0);
  if (full) throw new Error(`CAPACITY_FULL|${full.d}|`);

  const { error } = await supabase.from("bookings").insert({
    ...data,
    user_id: user.id,
    status: "pending",
  });
  if (error) throw new Error(error.message);

  const serviceLabel = data.service_type === "hotel" ? "🏨 Гостиница" : "🐾 Детский сад";
  const dateInfo = data.end_date
    ? `${data.start_date} → ${data.end_date}`
    : data.start_date;

  await sendTelegramNotification(
    `🆕 <b>Новая заявка с сайта</b>\n\n` +
    `${serviceLabel}\n` +
    `🐶 ${pet.type === "dog" ? "Собака" : "Кошка"}\n` +
    `📅 ${dateInfo}` +
    (data.notes ? `\n💬 ${data.notes}` : "") +
    `\n\n<i>Подробности — в админпанели</i>`
  );

  revalidatePath("/cabinet/bookings");
}
