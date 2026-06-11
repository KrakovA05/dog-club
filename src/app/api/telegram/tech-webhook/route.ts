import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabase/client";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_TECH!;
const OWNER_ID = Number(process.env.TELEGRAM_CHAT_ID_TECH);

async function tg(method: string, body: object) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function reply(chatId: number, text: string, keyboard?: object) {
  await tg("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...(keyboard ? { reply_markup: keyboard } : {}),
  });
}

function mainKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "🔍 Healthcheck", callback_data: "healthcheck" }],
    ],
  };
}

function refreshKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "🔄 Обновить", callback_data: "healthcheck" }],
    ],
  };
}

async function runHealthcheck(): Promise<string> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(SUPABASE_URL, serviceKey);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const timeStr = now.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow",
  });

  const [siteResult, dbResult, errorsResult] = await Promise.all([
    (async () => {
      const start = Date.now();
      try {
        const res = await fetch("https://lapaclub.ru", { signal: AbortSignal.timeout(8000) });
        return { ok: res.ok, ms: Date.now() - start };
      } catch {
        return { ok: false, ms: Date.now() - start };
      }
    })(),
    supabase.from("profiles").select("id", { count: "exact", head: true }).limit(1),
    supabase
      .from("site_errors")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStr + "T00:00:00"),
  ]);

  const siteIcon = siteResult.ok ? "✅" : "🔴";
  const dbIcon = !dbResult.error ? "✅" : "🔴";
  const errCount = errorsResult.count ?? 0;
  const errIcon = errCount === 0 ? "⚡️" : errCount < 5 ? "⚠️" : "🔴";

  return [
    `🔧 <b>Healthcheck — ${timeStr}</b>`,
    "",
    `${siteIcon} Сайт: ${siteResult.ok ? `доступен (${siteResult.ms}ms)` : "<b>НЕДОСТУПЕН!</b>"}`,
    `${dbIcon} База данных: ${!dbResult.error ? "в норме" : "<b>ошибка!</b>"}`,
    `${errIcon} Ошибок сегодня: ${errCount}`,
  ].join("\n");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Нажатие кнопки
    if (body.callback_query) {
      const cq = body.callback_query;
      const chatId: number = cq.message?.chat?.id;

      await tg("answerCallbackQuery", { callback_query_id: cq.id });

      if (chatId !== OWNER_ID) return Response.json({ ok: true });

      if (cq.data === "healthcheck") {
        const result = await runHealthcheck();
        await reply(chatId, result, refreshKeyboard());
      }

      return Response.json({ ok: true });
    }

    // Обычное сообщение
    if (body.message) {
      const msg = body.message;
      const chatId: number = msg.chat?.id;

      if (chatId !== OWNER_ID) {
        await reply(chatId, "⛔ Доступ запрещён");
        return Response.json({ ok: true });
      }

      const text: string = (msg.text ?? "").trim().toLowerCase();

      if (text === "/start" || text === "/help") {
        await reply(
          chatId,
          "🔧 <b>Технический бот Лапа Клуб</b>\n\nМониторинг сайта и базы данных в реальном времени.",
          mainKeyboard()
        );
        return Response.json({ ok: true });
      }

      if (text === "/healthcheck" || text === "/health" || text === "/status") {
        const result = await runHealthcheck();
        await reply(chatId, result, refreshKeyboard());
        return Response.json({ ok: true });
      }

      // Любое другое сообщение → главное меню
      await reply(
        chatId,
        "🔧 <b>Технический бот Лапа Клуб</b>\n\nМониторинг сайта и базы данных в реальном времени.",
        mainKeyboard()
      );
    }
  } catch (e) {
    console.error("Tech webhook error:", e);
  }

  return Response.json({ ok: true });
}
