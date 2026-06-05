import { createAdminClient } from "@/lib/supabase/admin";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const ALLOWED_USERNAMES = (process.env.TELEGRAM_ALLOWED_USERNAMES ?? "").split(",").map(u => u.trim().toLowerCase()).filter(Boolean);

async function tg(method: string, body: object) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mainKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📋 Заявки сегодня", callback_data: "today" },
        { text: "⏳ Ожидают", callback_data: "pending" },
      ],
      [
        { text: "📅 Ближайшие 7 дней", callback_data: "week" },
        { text: "📊 Статистика", callback_data: "stats" },
      ],
    ],
  };
}

function isAllowed(username?: string): boolean {
  if (!username) return false;
  if (ALLOWED_USERNAMES.length === 0) {
    // Если список пуст — разрешаем только TELEGRAM_CHAT_ID (владелец)
    return true;
  }
  return ALLOWED_USERNAMES.includes(username.toLowerCase());
}

async function handleCommand(chatId: number, data: string) {
  const supabase = createAdminClient();
  const todayStr = new Date().toLocaleDateString("sv"); // YYYY-MM-DD в локальной TZ

  if (data === "start") {
    await tg("sendMessage", {
      chat_id: chatId,
      text: "🐾 <b>Дог Клуб</b> — управление заявками\n\nВыберите действие:",
      parse_mode: "HTML",
      reply_markup: mainKeyboard(),
    });
    return;
  }

  if (data === "today") {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, service_type, daycare_format, start_date, end_date, status, pets(name, type)")
      .eq("start_date", todayStr)
      .neq("status", "cancelled")
      .order("created_at");

    if (!bookings?.length) {
      await tg("sendMessage", {
        chat_id: chatId,
        text: `📋 <b>Заявки на сегодня</b> (${todayStr})\n\nЗаявок нет`,
        parse_mode: "HTML",
        reply_markup: mainKeyboard(),
      });
      return;
    }

    const lines = bookings.map((b) => {
      const svc = b.service_type === "hotel" ? "🏨 Гостиница" : "🐾 Детский сад";
      const pet = (Array.isArray(b.pets) ? b.pets[0] : b.pets) as { name: string; type: string } | null;
      const petStr = pet ? `${pet.name} (${pet.type === "dog" ? "собака" : "кошка"})` : "—";
      const statusEmoji = b.status === "confirmed" ? "✅" : b.status === "pending" ? "⏳" : "✔️";
      return `${svc} — ${petStr} ${statusEmoji}`;
    });

    await tg("sendMessage", {
      chat_id: chatId,
      text: `📋 <b>Заявки на сегодня</b> (${todayStr})\n\n${lines.join("\n")}\n\nВсего: ${bookings.length}`,
      parse_mode: "HTML",
      reply_markup: mainKeyboard(),
    });
    return;
  }

  if (data === "pending") {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, service_type, start_date, end_date, pets(name, type)")
      .eq("status", "pending")
      .order("start_date");

    if (!bookings?.length) {
      await tg("sendMessage", {
        chat_id: chatId,
        text: "⏳ <b>Ожидают подтверждения</b>\n\nВсе заявки обработаны ✅",
        parse_mode: "HTML",
        reply_markup: mainKeyboard(),
      });
      return;
    }

    const lines = bookings.map((b, i) => {
      const svc = b.service_type === "hotel" ? "🏨" : "🐾";
      const pet = (Array.isArray(b.pets) ? b.pets[0] : b.pets) as { name: string; type: string } | null;
      const petStr = pet ? `${pet.name}` : "—";
      const dateStr = b.end_date ? `${b.start_date} → ${b.end_date}` : b.start_date;
      return `${i + 1}. ${svc} ${petStr} — ${dateStr}`;
    });

    await tg("sendMessage", {
      chat_id: chatId,
      text: `⏳ <b>Ожидают подтверждения</b>\n\n${lines.join("\n")}\n\nИтого: ${bookings.length}\n\n<a href="https://dogclub-kaluga.ru/admin/calendar">Открыть календарь</a>`,
      parse_mode: "HTML",
      reply_markup: mainKeyboard(),
    });
    return;
  }

  if (data === "week") {
    const weekLater = new Date();
    weekLater.setDate(weekLater.getDate() + 7);
    const weekStr = weekLater.toLocaleDateString("sv");

    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, service_type, start_date, status, pets(name, type)")
      .gte("start_date", todayStr)
      .lte("start_date", weekStr)
      .neq("status", "cancelled")
      .order("start_date");

    if (!bookings?.length) {
      await tg("sendMessage", {
        chat_id: chatId,
        text: "📅 <b>Ближайшие 7 дней</b>\n\nЗаявок нет",
        parse_mode: "HTML",
        reply_markup: mainKeyboard(),
      });
      return;
    }

    // Группируем по дате
    const byDate: Record<string, typeof bookings> = {};
    for (const b of bookings) {
      if (!byDate[b.start_date]) byDate[b.start_date] = [];
      byDate[b.start_date].push(b);
    }

    const lines: string[] = [];
    for (const [date, bks] of Object.entries(byDate)) {
      lines.push(`<b>${date}</b>`);
      for (const b of bks) {
        const svc = b.service_type === "hotel" ? "🏨" : "🐾";
        const pet = (Array.isArray(b.pets) ? b.pets[0] : b.pets) as { name: string; type: string } | null;
        const status = b.status === "confirmed" ? "✅" : "⏳";
        lines.push(`  ${svc} ${pet?.name ?? "—"} ${status}`);
      }
    }

    await tg("sendMessage", {
      chat_id: chatId,
      text: `📅 <b>Ближайшие 7 дней</b>\n\n${lines.join("\n")}\n\nВсего: ${bookings.length}`,
      parse_mode: "HTML",
      reply_markup: mainKeyboard(),
    });
    return;
  }

  if (data === "stats") {
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStr = monthStart.toLocaleDateString("sv");

    const { data: month } = await supabase
      .from("bookings")
      .select("id, service_type, status")
      .gte("created_at", monthStart.toISOString())
      .neq("status", "cancelled");

    const { data: pending } = await supabase
      .from("bookings")
      .select("id")
      .eq("status", "pending");

    const total = month?.length ?? 0;
    const daycare = month?.filter(b => b.service_type === "daycare").length ?? 0;
    const hotel = month?.filter(b => b.service_type === "hotel").length ?? 0;
    const pendingCount = pending?.length ?? 0;

    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `📊 <b>Статистика за текущий месяц</b>\n\n` +
        `Всего заявок: <b>${total}</b>\n` +
        `🐾 Детский сад: <b>${daycare}</b>\n` +
        `🏨 Гостиница: <b>${hotel}</b>\n\n` +
        `⏳ Ожидают подтверждения: <b>${pendingCount}</b>`,
      parse_mode: "HTML",
      reply_markup: mainKeyboard(),
    });
    return;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Callback query (нажатие кнопки)
    if (body.callback_query) {
      const cq = body.callback_query;
      const username = cq.from?.username;
      const chatId = cq.message?.chat?.id;

      await tg("answerCallbackQuery", { callback_query_id: cq.id });

      if (!isAllowed(username)) {
        await tg("sendMessage", { chat_id: chatId, text: "⛔ Доступ запрещён" });
        return Response.json({ ok: true });
      }

      await handleCommand(chatId, cq.data);
      return Response.json({ ok: true });
    }

    // Обычное сообщение
    if (body.message) {
      const msg = body.message;
      const username = msg.from?.username;
      const chatId = msg.chat?.id;
      const text: string = msg.text ?? "";

      if (!isAllowed(username)) {
        await tg("sendMessage", { chat_id: chatId, text: "⛔ У вас нет доступа к этому боту" });
        return Response.json({ ok: true });
      }

      if (text.startsWith("/start") || text === "меню" || text === "Меню") {
        await handleCommand(chatId, "start");
      } else {
        await handleCommand(chatId, "start");
      }
    }
  } catch (e) {
    console.error("Telegram webhook error:", e);
  }

  return Response.json({ ok: true });
}
