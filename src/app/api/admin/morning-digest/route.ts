import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabase/client";
import { sendTelegramNotification, escapeHtml } from "@/lib/telegram";

// Утренняя сводка по сегодняшним записям. Раньше жила в облачной Edge Function
// telegram-bot (вызывалась pg_cron миграции 014) — на self-host edge-runtime
// нет, поэтому портирована сюда; дёргает GitHub Actions (morning-digest.yml).
// Отличие от старой версии: гостевые брони больше не теряются (у них pet_id
// NULL — join по pets их отбрасывал), кличка берётся через coalesce.
export async function GET(req: Request) {
  const secret = req.headers.get("x-report-secret");
  if (secret !== process.env.REPORT_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "No service key" }, { status: 500 });

  const supabase = createClient(SUPABASE_URL, serviceKey);
  const todayStr = new Date().toLocaleDateString("sv", { timeZone: "Europe/Moscow" });

  const [{ data: starts }, { data: pending }] = await Promise.all([
    supabase
      .from("bookings")
      .select("service_type, status, guest_pet_name, pets(name)")
      .eq("start_date", todayStr)
      .neq("status", "cancelled")
      .order("created_at"),
    supabase.from("bookings").select("id").eq("status", "pending"),
  ]);

  const total = starts?.length ?? 0;
  const pendingCount = pending?.length ?? 0;

  let text = `☀️ <b>Доброе утро! Сводка на ${todayStr}</b>\n\n`;

  if (total === 0) {
    text += "Записей на сегодня нет.\n";
  } else {
    const lines = (starts ?? []).map((b) => {
      const svc = b.service_type === "hotel" ? "🏨" : "🐾";
      const petArr = b.pets as { name: string }[] | { name: string } | null;
      const pet = Array.isArray(petArr) ? petArr[0] : petArr;
      const name = pet?.name ?? b.guest_pet_name ?? "—";
      const statusEmoji = b.status === "confirmed" ? "✅" : "⏳";
      return `${svc} ${escapeHtml(name)} ${statusEmoji}`;
    });
    text += lines.join("\n") + `\n\nВсего: <b>${total}</b>`;
  }

  if (pendingCount > 0) {
    text += `\n\n⏳ Ожидают подтверждения: <b>${pendingCount}</b>`;
  }

  const result = await sendTelegramNotification(text);
  return NextResponse.json({ ok: result.sent, date: todayStr, telegram: result });
}
