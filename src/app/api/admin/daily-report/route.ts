import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTelegramNotification } from "@/lib/telegram";

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

export async function GET(req: Request) {
  // Защита: только внутренний вызов с секретом (из GitHub Actions)
  const secret = req.headers.get("x-report-secret");
  if (secret !== process.env.REPORT_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "No API key" }, { status: 500 });

  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const todayStr = today.toISOString().slice(0, 10);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  // Параллельно собираем все данные
  const [uptime, bookingsYesterday, bookingsToday, newUsers, totalBookings] = await Promise.all([
    checkSiteUptime(),

    // Брони созданные вчера
    supabase
      .from("bookings")
      .select("id, service_type, status, price_total, start_date")
      .gte("created_at", yesterdayStr)
      .lt("created_at", todayStr),

    // Заезды/посещения сегодня
    supabase
      .from("bookings")
      .select("id, service_type, pets(name, type)")
      .eq("start_date", todayStr)
      .eq("status", "confirmed"),

    // Новые регистрации вчера
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", yesterdayStr)
      .lt("created_at", todayStr),

    // Всего активных броней (confirmed)
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmed"),
  ]);

  const yesterdayBookings = bookingsYesterday.data ?? [];
  const todayArrivals = bookingsToday.data ?? [];
  const newUsersCount = newUsers.count ?? 0;
  const totalActiveCount = totalBookings.count ?? 0;

  const revenue = yesterdayBookings
    .filter((b) => b.price_total)
    .reduce((sum, b) => sum + (b.price_total ?? 0), 0);

  // Формируем контекст для Клода
  const statsContext = `
Дата отчёта: ${todayStr}
Сайт: ${uptime.ok ? `доступен (${uptime.ms}ms)` : `НЕДОСТУПЕН (${uptime.ms}ms)`}

Вчера (${yesterdayStr}):
- Новых заявок/броней: ${yesterdayBookings.length}
- Подтверждено: ${yesterdayBookings.filter((b) => b.status === "confirmed").length}
- Отменено: ${yesterdayBookings.filter((b) => b.status === "cancelled").length}
- Сумма по подтверждённым бронированиям: ${revenue > 0 ? `${revenue} ₽` : "не указана"}
- Новых пользователей: ${newUsersCount}

Сегодня заезжает/посещает: ${todayArrivals.length} питомцев
${todayArrivals.map((b) => `- ${(b.pets as unknown as { name: string; type: string } | null)?.name ?? "?"} (${b.service_type === "hotel" ? "гостиница" : "сад"})`).join("\n")}

Всего активных броней в системе: ${totalActiveCount}
`.trim();

  // Клод анализирует и пишет человеческий комментарий
  let aiComment = "";
  try {
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `Ты — ассистент администратора зоопансиона «Лапа Клуб» в Калуге.
Проанализируй данные за вчера и напиши короткий (2-3 предложения) комментарий на русском языке.
Отметь что хорошо, что настораживает, дай одну конкретную рекомендацию если есть.
Пиши кратко и по делу, без вступлений.

${statsContext}`,
          },
        ],
      }),
    });
    if (aiRes.ok) {
      const aiData = await aiRes.json();
      aiComment = aiData.content?.[0]?.text ?? "";
    }
  } catch {
    aiComment = "";
  }

  // Формируем Telegram-сообщение
  const statusIcon = uptime.ok ? "✅" : "🔴";
  const siteStatus = uptime.ok
    ? `доступен (${uptime.ms}ms)`
    : `<b>НЕДОСТУПЕН!</b>`;

  const arrivalsText =
    todayArrivals.length > 0
      ? todayArrivals
          .map((b) => {
            const pet = (b.pets as unknown as { name: string; type: string } | null);
            const icon = pet?.type === "cat" ? "🐱" : "🐶";
            const svc = b.service_type === "hotel" ? "гостиница" : "сад";
            return `  ${icon} ${pet?.name ?? "?"} (${svc})`;
          })
          .join("\n")
      : "  нет заездов";

  const message = [
    `🐾 <b>Лапа Клуб — отчёт за ${yesterdayStr}</b>`,
    "",
    `${statusIcon} Сайт: ${siteStatus}`,
    "",
    `<b>Вчера:</b>`,
    `📋 Новых броней: ${yesterdayBookings.length}`,
    `✅ Подтверждено: ${yesterdayBookings.filter((b) => b.status === "confirmed").length}`,
    revenue > 0 ? `💰 Сумма: ${revenue} ₽` : null,
    `👥 Новых клиентов: ${newUsersCount}`,
    "",
    `<b>Сегодня заезжают (${todayArrivals.length}):</b>`,
    arrivalsText,
    "",
    aiComment ? `📌 <i>${aiComment}</i>` : null,
  ]
    .filter((line) => line !== null)
    .join("\n");

  await sendTelegramNotification(message);

  return NextResponse.json({ ok: true, date: todayStr });
}
