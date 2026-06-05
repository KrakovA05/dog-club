"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendTelegramNotification } from "@/lib/telegram";

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

  const { error } = await supabase.from("bookings").insert({
    ...data,
    user_id: user.id,
    status: "pending",
  });
  if (error) throw new Error(error.message);

  // Получаем профиль для уведомления
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .single();

  const serviceLabel = data.service_type === "hotel" ? "🏨 Гостиница" : "🐾 Детский сад";
  const dateInfo = data.end_date
    ? `${data.start_date} → ${data.end_date}`
    : data.start_date;

  await sendTelegramNotification(
    `🆕 <b>Новая заявка с сайта</b>\n\n` +
    `${serviceLabel}\n` +
    `👤 ${profile?.full_name ?? user.email ?? "Клиент"}${profile?.phone ? ` · ${profile.phone}` : ""}\n` +
    `🐶 ${pet.name} (${pet.type === "dog" ? "собака" : "кошка"})\n` +
    `📅 ${dateInfo}` +
    (data.notes ? `\n💬 ${data.notes}` : "")
  );

  revalidatePath("/cabinet/bookings");
}
