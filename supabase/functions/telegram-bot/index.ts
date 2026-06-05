import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const OWNER_CHAT_ID = Number(Deno.env.get("TELEGRAM_CHAT_ID"));
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function supabase() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

async function tg(method: string, body: object) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ─── Доступ и роли ────────────────────────────────────────────────────────────

interface UserRecord { username: string; is_admin: boolean }

async function getUserRecord(username: string): Promise<UserRecord | null> {
  const { data } = await supabase()
    .from("telegram_bot_users")
    .select("username, is_admin")
    .eq("username", username.toLowerCase())
    .single();
  return data as UserRecord | null;
}

async function isAllowed(chatId: number, username?: string): Promise<boolean> {
  if (chatId === OWNER_CHAT_ID) return true;
  if (!username) return false;
  return !!(await getUserRecord(username));
}

async function canManageUsers(chatId: number, username?: string): Promise<boolean> {
  if (chatId === OWNER_CHAT_ID) return true;
  if (!username) return false;
  const rec = await getUserRecord(username);
  return !!rec?.is_admin;
}

async function getAllUsers(): Promise<UserRecord[]> {
  const { data } = await supabase()
    .from("telegram_bot_users")
    .select("username, is_admin")
    .order("added_at");
  return (data ?? []) as UserRecord[];
}

async function addUser(username: string): Promise<boolean> {
  const { error } = await supabase()
    .from("telegram_bot_users")
    .insert({ username: username.toLowerCase().replace(/^@/, ""), is_admin: false });
  return !error;
}

async function removeUser(username: string): Promise<void> {
  await supabase().from("telegram_bot_users").delete().eq("username", username.toLowerCase());
}

async function setUserAdmin(username: string, isAdmin: boolean): Promise<void> {
  await supabase()
    .from("telegram_bot_users")
    .update({ is_admin: isAdmin })
    .eq("username", username.toLowerCase());
}

// ─── Клавиатуры ──────────────────────────────────────────────────────────────

function mainKeyboard(canManage: boolean) {
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
  if (canManage) {
    rows.push([{ text: "👥 Управление доступом", callback_data: "manage_users" }]);
  }
  return { inline_keyboard: rows };
}

async function usersKeyboard(users: UserRecord[], isOwner: boolean) {
  const rows = users.map((u) => {
    const row = [
      { text: `${u.is_admin ? "⭐" : "👤"} @${u.username}`, callback_data: "noop" },
      { text: "❌", callback_data: `remove_user:${u.username}` },
    ];
    // Только владелец может менять роль администратора
    if (isOwner) {
      row.splice(1, 0, {
        text: u.is_admin ? "👤 Снять" : "⭐ Админ",
        callback_data: u.is_admin ? `demote_user:${u.username}` : `promote_user:${u.username}`,
      });
    }
    return row;
  });
  rows.push([{ text: "« Назад", callback_data: "start" }]);
  return { inline_keyboard: rows };
}

// ─── Обработчики ─────────────────────────────────────────────────────────────

async function handleCommand(chatId: number, data: string, canManage: boolean, isOwner: boolean) {
  const db = supabase();
  const todayStr = new Date().toLocaleDateString("sv");

  if (data === "start") {
    await tg("sendMessage", {
      chat_id: chatId,
      text: "🐾 <b>Дог Клуб</b> — управление заявками\n\nВыберите действие:",
      parse_mode: "HTML",
      reply_markup: mainKeyboard(canManage),
    });
    return;
  }

  if (data === "today") {
    const { data: bookings } = await db
      .from("bookings")
      .select("id, service_type, start_date, status, pets(name, type)")
      .eq("start_date", todayStr)
      .neq("status", "cancelled")
      .order("created_at");

    if (!bookings?.length) {
      await tg("sendMessage", {
        chat_id: chatId,
        text: `📋 <b>Заявки на сегодня</b> (${todayStr})\n\nЗаявок нет`,
        parse_mode: "HTML",
        reply_markup: mainKeyboard(canManage),
      });
      return;
    }

    const lines = bookings.map((b: Record<string, unknown>) => {
      const svc = b.service_type === "hotel" ? "🏨 Гостиница" : "🐾 Детский сад";
      const petArr = b.pets as { name: string; type: string }[] | null;
      const pet = Array.isArray(petArr) ? petArr[0] : petArr;
      const petStr = pet ? `${pet.name} (${pet.type === "dog" ? "собака" : "кошка"})` : "—";
      const statusEmoji = b.status === "confirmed" ? "✅" : b.status === "pending" ? "⏳" : "✔️";
      return `${svc} — ${petStr} ${statusEmoji}`;
    });

    await tg("sendMessage", {
      chat_id: chatId,
      text: `📋 <b>Заявки на сегодня</b> (${todayStr})\n\n${lines.join("\n")}\n\nВсего: ${bookings.length}`,
      parse_mode: "HTML",
      reply_markup: mainKeyboard(canManage),
    });
    return;
  }

  if (data === "pending") {
    const { data: bookings } = await db
      .from("bookings")
      .select("id, service_type, start_date, end_date, pets(name, type)")
      .eq("status", "pending")
      .order("start_date");

    if (!bookings?.length) {
      await tg("sendMessage", {
        chat_id: chatId,
        text: "⏳ <b>Ожидают подтверждения</b>\n\nВсе заявки обработаны ✅",
        parse_mode: "HTML",
        reply_markup: mainKeyboard(canManage),
      });
      return;
    }

    const lines = bookings.map((b: Record<string, unknown>, i: number) => {
      const svc = b.service_type === "hotel" ? "🏨" : "🐾";
      const petArr = b.pets as { name: string; type: string }[] | null;
      const pet = Array.isArray(petArr) ? petArr[0] : petArr;
      const dateStr = b.end_date ? `${b.start_date} → ${b.end_date}` : b.start_date;
      return `${i + 1}. ${svc} ${pet?.name ?? "—"} — ${dateStr}`;
    });

    await tg("sendMessage", {
      chat_id: chatId,
      text: `⏳ <b>Ожидают подтверждения</b>\n\n${lines.join("\n")}\n\nИтого: ${bookings.length}\n\n<a href="https://dogclub-kaluga.ru/admin/calendar">Открыть календарь</a>`,
      parse_mode: "HTML",
      reply_markup: mainKeyboard(canManage),
    });
    return;
  }

  if (data === "week") {
    const weekLater = new Date();
    weekLater.setDate(weekLater.getDate() + 7);
    const weekStr = weekLater.toLocaleDateString("sv");

    const { data: bookings } = await db
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
        reply_markup: mainKeyboard(canManage),
      });
      return;
    }

    const byDate: Record<string, typeof bookings> = {};
    for (const b of bookings) {
      const d = b.start_date as string;
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(b);
    }

    const lines: string[] = [];
    for (const [date, bks] of Object.entries(byDate)) {
      lines.push(`<b>${date}</b>`);
      for (const b of bks) {
        const svc = b.service_type === "hotel" ? "🏨" : "🐾";
        const petArr = b.pets as { name: string; type: string }[] | null;
        const pet = Array.isArray(petArr) ? petArr[0] : petArr;
        const status = b.status === "confirmed" ? "✅" : "⏳";
        lines.push(`  ${svc} ${pet?.name ?? "—"} ${status}`);
      }
    }

    await tg("sendMessage", {
      chat_id: chatId,
      text: `📅 <b>Ближайшие 7 дней</b>\n\n${lines.join("\n")}\n\nВсего: ${bookings.length}`,
      parse_mode: "HTML",
      reply_markup: mainKeyboard(canManage),
    });
    return;
  }

  if (data === "stats") {
    const monthStart = new Date();
    monthStart.setDate(1);

    const { data: month } = await db
      .from("bookings")
      .select("id, service_type")
      .gte("created_at", monthStart.toISOString())
      .neq("status", "cancelled");

    const { data: pendingAll } = await db.from("bookings").select("id").eq("status", "pending");

    const total = month?.length ?? 0;
    const daycare = month?.filter((b: Record<string, unknown>) => b.service_type === "daycare").length ?? 0;
    const hotel = month?.filter((b: Record<string, unknown>) => b.service_type === "hotel").length ?? 0;

    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `📊 <b>Статистика за текущий месяц</b>\n\n` +
        `Всего заявок: <b>${total}</b>\n` +
        `🐾 Детский сад: <b>${daycare}</b>\n` +
        `🏨 Гостиница: <b>${hotel}</b>\n\n` +
        `⏳ Ожидают подтверждения: <b>${pendingAll?.length ?? 0}</b>`,
      parse_mode: "HTML",
      reply_markup: mainKeyboard(canManage),
    });
    return;
  }

  if (data === "manage_users" && canManage) {
    const users = await getAllUsers();
    const hint = isOwner
      ? "Чтобы добавить — напишите: <code>+username</code>\n⭐ — администратор (может управлять доступом)"
      : "Чтобы добавить — напишите: <code>+username</code>";
    const text = `👥 <b>Пользователи с доступом</b>${users.length ? ` (${users.length})` : ""}\n\n${hint}`;
    await tg("sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: await usersKeyboard(users, isOwner),
    });
    return;
  }

  if (data.startsWith("remove_user:") && canManage) {
    const username = data.replace("remove_user:", "");
    await removeUser(username);
    const users = await getAllUsers();
    await tg("sendMessage", {
      chat_id: chatId,
      text: `✅ @${username} удалён\n\nЧтобы добавить — напишите: <code>+username</code>`,
      parse_mode: "HTML",
      reply_markup: await usersKeyboard(users, isOwner),
    });
    return;
  }

  if (data.startsWith("promote_user:") && isOwner) {
    const username = data.replace("promote_user:", "");
    await setUserAdmin(username, true);
    const users = await getAllUsers();
    await tg("sendMessage", {
      chat_id: chatId,
      text: `⭐ @${username} теперь администратор — может управлять доступом`,
      parse_mode: "HTML",
      reply_markup: await usersKeyboard(users, isOwner),
    });
    return;
  }

  if (data.startsWith("demote_user:") && isOwner) {
    const username = data.replace("demote_user:", "");
    await setUserAdmin(username, false);
    const users = await getAllUsers();
    await tg("sendMessage", {
      chat_id: chatId,
      text: `👤 @${username} стал обычным пользователем`,
      parse_mode: "HTML",
      reply_markup: await usersKeyboard(users, isOwner),
    });
    return;
  }
}

// ─── Webhook ─────────────────────────────────────────────────────────────────

async function sendMorningDigest() {
  const db = supabase();
  const todayStr = new Date().toLocaleDateString("sv");

  const { data: bookings } = await db
    .from("bookings")
    .select("service_type, status, pets(name, type)")
    .eq("start_date", todayStr)
    .neq("status", "cancelled")
    .order("created_at");

  const { data: pending } = await db
    .from("bookings")
    .select("id")
    .eq("status", "pending");

  const total = bookings?.length ?? 0;
  const pendingCount = pending?.length ?? 0;

  let text = `☀️ <b>Доброе утро! Сводка на ${todayStr}</b>\n\n`;

  if (total === 0) {
    text += "Записей на сегодня нет.\n";
  } else {
    const lines = (bookings ?? []).map((b: Record<string, unknown>) => {
      const svc = b.service_type === "hotel" ? "🏨" : "🐾";
      const petArr = b.pets as { name: string; type: string }[] | null;
      const pet = Array.isArray(petArr) ? petArr[0] : petArr;
      const statusEmoji = b.status === "confirmed" ? "✅" : "⏳";
      return `${svc} ${pet?.name ?? "—"} ${statusEmoji}`;
    });
    text += lines.join("\n") + `\n\nВсего: <b>${total}</b>`;
  }

  if (pendingCount > 0) {
    text += `\n\n⏳ Ожидают подтверждения: <b>${pendingCount}</b>`;
  }

  await tg("sendMessage", {
    chat_id: OWNER_CHAT_ID,
    text,
    parse_mode: "HTML",
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");

  try {
    const body = await req.json();

    // Запрос от pg_cron — утренний дайджест
    if (body.digest === true) {
      await sendMorningDigest();
      return new Response("ok");
    }

    if (body.callback_query) {
      const cq = body.callback_query;
      const chatId: number = cq.message?.chat?.id;
      const username: string | undefined = cq.from?.username;
      const isOwner = chatId === OWNER_CHAT_ID;

      await tg("answerCallbackQuery", { callback_query_id: cq.id });
      if (cq.data === "noop") return new Response("ok");

      if (!await isAllowed(chatId, username)) {
        await tg("sendMessage", { chat_id: chatId, text: "⛔ Доступ запрещён" });
        return new Response("ok");
      }

      const canManage = await canManageUsers(chatId, username);
      await handleCommand(chatId, cq.data, canManage, isOwner);
      return new Response("ok");
    }

    if (body.message) {
      const msg = body.message;
      const chatId: number = msg.chat?.id;
      const username: string | undefined = msg.from?.username;
      const text: string = msg.text ?? "";
      const isOwner = chatId === OWNER_CHAT_ID;

      if (!await isAllowed(chatId, username)) {
        await tg("sendMessage", { chat_id: chatId, text: "⛔ У вас нет доступа к этому боту" });
        return new Response("ok");
      }

      const canManage = await canManageUsers(chatId, username);

      // Добавление пользователя через +username (владелец или админ)
      if (canManage && text.startsWith("+") && text.length > 1) {
        const newUsername = text.slice(1).replace(/^@/, "").trim();
        if (newUsername) {
          const ok = await addUser(newUsername);
          const users = await getAllUsers();
          await tg("sendMessage", {
            chat_id: chatId,
            text: ok ? `✅ @${newUsername} добавлен` : `⚠️ @${newUsername} уже есть в списке`,
            parse_mode: "HTML",
            reply_markup: await usersKeyboard(users, isOwner),
          });
          return new Response("ok");
        }
      }

      await handleCommand(chatId, "start", canManage, isOwner);
    }
  } catch (e) {
    console.error("Telegram webhook error:", e);
  }

  return new Response("ok");
});
