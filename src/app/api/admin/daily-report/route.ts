import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabase/client";
import { sendTechNotification } from "@/lib/telegram";

const SITE_URL = "https://lapaclub.ru";

async function checkSiteUptime(): Promise<{ ok: boolean; ms: number }> {
  const start = Date.now();
  try {
    const res = await fetch(SITE_URL, { signal: AbortSignal.timeout(8000) });
    return { ok: res.ok, ms: Date.now() - start };
  } catch {
    return { ok: false, ms: Date.now() - start };
  }
}

async function getAiComment(apiKey: string, context: string, isEvening: boolean): Promise<string> {
  try {
    const prompt = isEvening
      ? `Ты — технический ассистент зоопансиона «Лапа Клуб». Проанализируй итоги сегодняшнего дня. Напиши 2-3 предложения: что прошло хорошо, есть ли поводы для беспокойства, одна рекомендация на завтра. Кратко, без вступлений, без markdown.`
      : `Ты — технический ассистент зоопансиона «Лапа Клуб». Проанализируй данные за вчера. Напиши 2-3 предложения: что хорошо, что настораживает, одна конкретная рекомендация. Кратко, без вступлений, без markdown.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{ role: "user", content: `${prompt}\n\n${context}` }],
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return data.content?.[0]?.text ?? "";
  } catch {
    return "";
  }
}

export async function GET(req: Request) {
  const secret = req.headers.get("x-report-secret");
  if (secret !== process.env.REPORT_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "No API key" }, { status: 500 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "No service key" }, { status: 500 });

  const supabase = createClient(SUPABASE_URL, serviceKey);

  const url = new URL(req.url);
  const isEvening = url.searchParams.get("today") === "1";

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  // Период для статистики: сегодня (вечер) или вчера (утро)
  const periodStart = isEvening ? todayStr : yesterdayStr;
  const periodEnd = isEvening ? todayStr : todayStr;
  const periodLabel = isEvening ? `сегодня (${todayStr})` : `вчера (${yesterdayStr})`;

  const [uptime, periodBookings, newUsers, totalBookings, tomorrowArrivals] = await Promise.all([
    checkSiteUptime(),

    supabase
      .from("bookings")
      .select("id, service_type, status, start_date")
      .gte("created_at", periodStart + "T00:00:00")
      .lte("created_at", periodEnd + "T23:59:59")
      .neq("status", "cancelled"),

    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", periodStart + "T00:00:00")
      .lte("created_at", periodEnd + "T23:59:59"),

    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmed"),

    // Завтрашние заезды — всегда показываем
    supabase
      .from("bookings")
      .select("id, service_type, pets(name, type)")
      .eq("start_date", tomorrowStr)
      .eq("status", "confirmed"),
  ]);

  const bookings = periodBookings.data ?? [];
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const pending = bookings.filter((b) => b.status === "pending").length;
  const newUsersCount = newUsers.count ?? 0;
  const totalActive = totalBookings.count ?? 0;
  const arrivals = tomorrowArrivals.data ?? [];

  const statsContext = `
Период: ${periodLabel}
Сайт: ${uptime.ok ? `доступен (${uptime.ms}ms)` : `НЕДОСТУПЕН`}
Новых броней: ${bookings.length} (подтверждено: ${confirmed}, ожидает: ${pending})
Новых клиентов: ${newUsersCount}
Всего активных броней в системе: ${totalActive}
Завтра заезжает питомцев: ${arrivals.length}
`.trim();

  const aiComment = await getAiComment(apiKey, statsContext, isEvening);

  const statusIcon = uptime.ok ? "✅" : "🔴";
  const siteStatus = uptime.ok ? `доступен (${uptime.ms}ms)` : `<b>НЕДОСТУПЕН!</b>`;

  const arrivalsText = arrivals.length > 0
    ? arrivals.map((b) => {
        const pet = b.pets as unknown as { name: string; type: string } | null;
        const icon = pet?.type === "cat" ? "🐱" : "🐶";
        return `  ${icon} ${pet?.name ?? "?"} (${b.service_type === "hotel" ? "гостиница" : "сад"})`;
      }).join("\n")
    : "  нет заездов";

  const header = isEvening
    ? `🔧 <b>Техотчёт — итоги ${todayStr}</b>`
    : `🔧 <b>Техотчёт — доброе утро, ${todayStr}</b>`;

  const periodTitle = isEvening ? "<b>За сегодня:</b>" : "<b>Вчера:</b>";

  const message = [
    header,
    "",
    `${statusIcon} Сайт: ${siteStatus}`,
    "",
    periodTitle,
    `📋 Новых броней: ${bookings.length}`,
    `✅ Подтверждено: ${confirmed}`,
    pending > 0 ? `⏳ Ожидает подтверждения: ${pending}` : null,
    `👥 Новых клиентов: ${newUsersCount}`,
    `📊 Активных броней в системе: ${totalActive}`,
    "",
    `<b>Завтра заезжают (${arrivals.length}):</b>`,
    arrivalsText,
    "",
    aiComment ? `📌 <i>${aiComment}</i>` : null,
  ]
    .filter((line) => line !== null)
    .join("\n");

  await sendTechNotification(message);

  return NextResponse.json({ ok: true, date: todayStr, mode: isEvening ? "evening" : "morning" });
}
