import { createAdminClient } from "@/lib/supabase/admin";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
// Владелец — всегда имеет доступ, видит кнопку управления
const OWNER_CHAT_ID = Number(process.env.TELEGRAM_CHAT_ID);

async function tg(method: string, body: object) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ─── Проверка доступа ─────────────────────────────────────────────────────────

async function isAllowed(chatId: number, username?: string): Promise<boolean> {
  if (chatId === OWNER_CHAT_ID) return true;
  if (!username) return false;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("telegram_bot_users")
    .select("username")
    .eq("username", username.toLowerCase())
    .single();
  return !!data;
}

// Запоминаем chat_id — без него нельзя слать уведомления (по username Telegram не отправляет)
async function rememberChatId(chatId: number, username?: string) {
  if (!username || chatId === OWNER_CHAT_ID) return;
  const supabase = createAdminClient();
  await supabase
    .from("telegram_bot_users")
    .update({ chat_id: chatId })
    .eq("username", username.toLowerCase());
}

async function getAllUsers(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("telegram_bot_users")
    .select("username")
    .order("added_at");
  return (data ?? []).map((r) => r.username);
}

async function addUser(username: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("telegram_bot_users")
    .insert({ username: username.toLowerCase().replace(/^@/, "") });
  return !error;
}

async function removeUser(username: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("telegram_bot_users")
    .delete()
    .eq("username", username.toLowerCase());
}

// ─── Клавиатуры ──────────────────────────────────────────────────────────────

function mainKeyboard(isOwner: boolean) {
  const rows = [
    [
      { text: "📋 Заявки сегодня", callback_data: "today" },
      { text: "⏳ Ожидают", callback_data: "pending" },
    ],
    [
      { text: "📅 Ближайшие 7 дней", callback_data: "week" },
      { text: "📊 Статистика", callback_data: "stats" },
    ],
  ];
  if (isOwner) {
    rows.push([{ text: "👥 Управление доступом", callback_data: "manage_users" }]);
  }
  return { inline_keyboard: rows };
}

async function usersKeyboard(users: string[]) {
  const rows = users.map((u) => [
    { text: `@${u}`, callback_data: `noop` },
    { text: "❌ Удалить", callback_data: `remove_user:${u}` },
  ]);
  rows.push([{ text: "« Назад", callback_data: "start" }]);
  return { inline_keyboard: rows };
}

// ─── Обработчики команд ──────────────────────────────────────────────────────

async function handleCommand(chatId: number, data: string, isOwner: boolean) {
  const supabase = createAdminClient();
  const todayStr = new Date().toLocaleDateString("sv");

  // Главное меню
  if (data === "start") {
    await tg("sendMessage", {
      chat_id: chatId,
      text: "🐾 <b>Лапа Клуб</b> — управление заявками\n\nВыберите действие:",
      parse_mode: "HTML",
      reply_markup: mainKeyboard(isOwner),
    });
    return;
  }

  // Заявки сегодня
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
        reply_markup: mainKeyboard(isOwner),
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
      reply_markup: mainKeyboard(isOwner),
    });
    return;
  }

  // Ожидают подтверждения
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
        reply_markup: mainKeyboard(isOwner),
      });
      return;
    }

    const lines = bookings.map((b, i) => {
      const svc = b.service_type === "hotel" ? "🏨" : "🐾";
      const pet = (Array.isArray(b.pets) ? b.pets[0] : b.pets) as { name: string; type: string } | null;
      const dateStr = b.end_date ? `${b.start_date} → ${b.end_date}` : b.start_date;
      return `${i + 1}. ${svc} ${pet?.name ?? "—"} — ${dateStr}`;
    });

    await tg("sendMessage", {
      chat_id: chatId,
      text: `⏳ <b>Ожидают подтверждения</b>\n\n${lines.join("\n")}\n\nИтого: ${bookings.length}\n\n<a href="https://lapaclub.ru/admin/calendar">Открыть календарь</a>`,
      parse_mode: "HTML",
      reply_markup: mainKeyboard(isOwner),
    });
    return;
  }

  // Ближайшие 7 дней
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
        reply_markup: mainKeyboard(isOwner),
      });
      return;
    }

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
      reply_markup: mainKeyboard(isOwner),
    });
    return;
  }

  // Статистика
  if (data === "stats") {
    const monthStart = new Date();
    monthStart.setDate(1);

    const { data: month } = await supabase
      .from("bookings")
      .select("id, service_type")
      .gte("created_at", monthStart.toISOString())
      .neq("status", "cancelled");

    const { data: pendingAll } = await supabase
      .from("bookings")
      .select("id")
      .eq("status", "pending");

    const total = month?.length ?? 0;
    const daycare = month?.filter(b => b.service_type === "daycare").length ?? 0;
    const hotel = month?.filter(b => b.service_type === "hotel").length ?? 0;

    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `📊 <b>Статистика за текущий месяц</b>\n\n` +
        `Всего заявок: <b>${total}</b>\n` +
        `🐾 Детский сад: <b>${daycare}</b>\n` +
        `🏨 Гостиница: <b>${hotel}</b>\n\n` +
        `⏳ Ожидают подтверждения: <b>${pendingAll?.length ?? 0}</b>`,
      parse_mode: "HTML",
      reply_markup: mainKeyboard(isOwner),
    });
    return;
  }

  // Управление пользователями (только владелец)
  if (data === "manage_users" && isOwner) {
    const users = await getAllUsers();
    const text = users.length
      ? `👥 <b>Пользователи с доступом</b>\n\nЧтобы добавить — напишите: <code>+username</code>\n\nСписок (${users.length}):`
      : `👥 <b>Пользователи с доступом</b>\n\nПользователей пока нет.\n\nЧтобы добавить — напишите: <code>+username</code>`;

    await tg("sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: await usersKeyboard(users),
    });
    return;
  }

  // Удалить пользователя
  if (data.startsWith("remove_user:") && isOwner) {
    const username = data.replace("remove_user:", "");
    await removeUser(username);
    const users = await getAllUsers();
    const text = users.length
      ? `👥 <b>Пользователи с доступом</b>\n\n✅ @${username} удалён\n\nЧтобы добавить — напишите: <code>+username</code>`
      : `👥 <b>Пользователи с доступом</b>\n\n✅ @${username} удалён\n\nСписок пуст. Чтобы добавить — напишите: <code>+username</code>`;

    await tg("sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: await usersKeyboard(users),
    });
    return;
  }
}

// ─── Webhook handler ─────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Callback query (нажатие кнопки)
    if (body.callback_query) {
      const cq = body.callback_query;
      const chatId: number = cq.message?.chat?.id;
      const username: string | undefined = cq.from?.username;
      const isOwner = chatId === OWNER_CHAT_ID;

      await tg("answerCallbackQuery", { callback_query_id: cq.id });

      if (cq.data === "noop") return Response.json({ ok: true });

      if (!await isAllowed(chatId, username)) {
        await tg("sendMessage", { chat_id: chatId, text: "⛔ Доступ запрещён" });
        return Response.json({ ok: true });
      }

      await rememberChatId(chatId, username);
      await handleCommand(chatId, cq.data, isOwner);
      return Response.json({ ok: true });
    }

    // Обычное сообщение
    if (body.message) {
      const msg = body.message;
      const chatId: number = msg.chat?.id;
      const username: string | undefined = msg.from?.username;
      const text: string = msg.text ?? "";
      const isOwner = chatId === OWNER_CHAT_ID;

      if (!await isAllowed(chatId, username)) {
        await tg("sendMessage", { chat_id: chatId, text: "⛔ У вас нет доступа к этому боту" });
        return Response.json({ ok: true });
      }

      await rememberChatId(chatId, username);

      // Добавление пользователя через +username (только владелец)
      if (isOwner && text.startsWith("+") && text.length > 1) {
        const newUsername = text.slice(1).replace(/^@/, "").trim();
        if (newUsername) {
          const ok = await addUser(newUsername);
          const users = await getAllUsers();
          await tg("sendMessage", {
            chat_id: chatId,
            text: ok
              ? `✅ @${newUsername} добавлен\n\nЧтобы удалить — нажмите ❌ рядом с пользователем.`
              : `⚠️ @${newUsername} уже есть в списке`,
            parse_mode: "HTML",
            reply_markup: await usersKeyboard(users),
          });
          return Response.json({ ok: true });
        }
      }

      // Все остальные сообщения — показываем главное меню
      await handleCommand(chatId, "start", isOwner);
    }
  } catch (e) {
    console.error("Telegram webhook error:", e);
  }

  return Response.json({ ok: true });
}
