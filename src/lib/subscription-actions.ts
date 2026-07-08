"use server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { SUBSCRIPTION_PLANS, type SubscriptionType } from "@/types";

// Абонементы детсада (миграция 026). Все действия — только админ:
// продажа очная/по телефону, отметки ставит персонал на месте.

async function requireAdmin(): Promise<string> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) throw new Error("Forbidden");
  return user.id;
}

function revalidate() {
  revalidatePath("/admin/subscriptions");
  revalidatePath("/cabinet/subscriptions");
}

type CreateSubscription = {
  type: SubscriptionType;
  pet_id: string | null;
  purchased_at: string | null; // ISO-дата; null = сейчас
  notes: string | null;
} & (
  | { mode: "registered"; user_id: string }
  | { mode: "guest"; guest_name: string; guest_phone: string; consentReceived: boolean }
);

export async function createSubscription(data: CreateSubscription) {
  await requireAdmin();

  // 152-ФЗ: ПДн гостя вводит админ — согласие обязательно, факт в notes
  if (data.mode === "guest" && !data.consentReceived) {
    throw new Error("Отметьте, что клиент дал согласие на обработку персональных данных");
  }

  const plan = SUBSCRIPTION_PLANS[data.type];
  const purchased = data.purchased_at ? new Date(data.purchased_at) : new Date();
  const expires = new Date(purchased);
  expires.setDate(expires.getDate() + plan.durationDays);

  const noteParts: string[] = [];
  if (data.mode === "guest") noteParts.push("✅ Согласие на обработку ПДн получено.");
  if (data.notes) noteParts.push(data.notes);

  const owner = data.mode === "registered"
    ? { user_id: data.user_id }
    : { guest_name: data.guest_name.trim(), guest_phone: data.guest_phone.trim() };

  const supabase = createAdminClient();
  const { error } = await supabase.from("subscriptions").insert({
    ...owner,
    pet_id: data.pet_id,
    type: data.type,
    total_visits: plan.visits,
    price: plan.price,
    purchased_at: purchased.toISOString(),
    expires_at: expires.toISOString(),
    status: "active",
    notes: noteParts.length > 0 ? noteParts.join(" ") : null,
  });
  if (error) throw new Error(error.message);
  revalidate();
}

// Отметка посещения. Возвращает новое число посещений и флаг «абонемент закрыт».
export async function markVisit(
  subscriptionId: string,
  visitDate: string
): Promise<{ visits: number; usedUp: boolean }> {
  const adminId = await requireAdmin();
  const supabase = createAdminClient();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("id, status, total_visits, expires_at")
    .eq("id", subscriptionId)
    .single();
  if (!sub) throw new Error("Абонемент не найден");

  // Крайние случаи — понятные сообщения
  if (sub.status === "frozen") throw new Error("Абонемент заморожен — сначала разморозьте его");
  if (sub.status === "used_up") throw new Error("Абонемент полностью использован");
  if (sub.status === "expired" || new Date(sub.expires_at) < new Date()) {
    throw new Error("Срок действия абонемента истёк");
  }

  const { error: insError } = await supabase.from("subscription_visits").insert({
    subscription_id: subscriptionId,
    visit_date: visitDate,
    marked_by: adminId,
  });
  if (insError) throw new Error(insError.message);

  const { count } = await supabase
    .from("subscription_visits")
    .select("id", { count: "exact", head: true })
    .eq("subscription_id", subscriptionId);

  const visits = count ?? 0;
  const usedUp = visits >= sub.total_visits;
  if (usedUp) {
    await supabase.from("subscriptions").update({ status: "used_up" }).eq("id", subscriptionId);
  }

  revalidate();
  return { visits, usedUp };
}

// Отмена ошибочной отметки (DELETE строки журнала). Если абонемент был закрыт
// и посещений снова меньше лимита — возвращаем в active (если срок не вышел).
export async function unmarkVisit(visitId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: visit } = await supabase
    .from("subscription_visits")
    .select("id, subscription_id")
    .eq("id", visitId)
    .single();
  if (!visit) throw new Error("Отметка не найдена");

  const { error } = await supabase.from("subscription_visits").delete().eq("id", visitId);
  if (error) throw new Error(error.message);

  const [{ data: sub }, { count }] = await Promise.all([
    supabase.from("subscriptions").select("status, total_visits, expires_at").eq("id", visit.subscription_id).single(),
    supabase.from("subscription_visits").select("id", { count: "exact", head: true }).eq("subscription_id", visit.subscription_id),
  ]);

  if (sub?.status === "used_up" && (count ?? 0) < sub.total_visits) {
    const backTo = new Date(sub.expires_at) < new Date() ? "expired" : "active";
    await supabase.from("subscriptions").update({ status: backTo }).eq("id", visit.subscription_id);
  }

  revalidate();
}

export async function freezeSubscription(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: sub } = await supabase
    .from("subscriptions").select("status").eq("id", id).single();
  if (!sub) throw new Error("Абонемент не найден");
  if (sub.status !== "active") throw new Error("Заморозить можно только активный абонемент");

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "frozen", frozen_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidate();
}

// Разморозка: срок продлевается на длительность заморозки
export async function unfreezeSubscription(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: sub } = await supabase
    .from("subscriptions").select("status, frozen_at, expires_at").eq("id", id).single();
  if (!sub) throw new Error("Абонемент не найден");
  if (sub.status !== "frozen" || !sub.frozen_at) throw new Error("Абонемент не заморожен");

  const frozenMs = Date.now() - new Date(sub.frozen_at).getTime();
  const newExpires = new Date(new Date(sub.expires_at).getTime() + frozenMs);

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "active", frozen_at: null, expires_at: newExpires.toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidate();
}

export async function updateSubscriptionNotes(id: string, notes: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({ notes: notes.trim() || null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidate();
}
