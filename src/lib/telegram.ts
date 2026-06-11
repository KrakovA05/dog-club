import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabase/client";

type SendResult = { sent: boolean; error?: string };

// chat_id заполняется вебхуком при первом обращении пользователя к боту
async function getExtraRecipients(): Promise<string[]> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return [];
  try {
    const supabase = createClient(SUPABASE_URL, key);
    const { data } = await supabase
      .from("telegram_bot_users")
      .select("chat_id")
      .not("chat_id", "is", null);
    return (data ?? []).map((r) => String(r.chat_id));
  } catch {
    return [];
  }
}

async function sendMessage(token: string, chatId: string, text: string): Promise<SendResult> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error("Telegram sendMessage failed:", data.description);
      return { sent: false, error: data.description };
    }
    return { sent: true };
  } catch (e) {
    // не роняем сервер если Telegram недоступен
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Telegram sendMessage error:", msg);
    return { sent: false, error: msg };
  }
}

// Основной бот — брони, клиенты, бизнес-события.
// Рассылается владельцу и всем из telegram_bot_users с известным chat_id.
export async function sendTelegramNotification(text: string): Promise<SendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { sent: false, error: "TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID не заданы" };

  const extras = await getExtraRecipients();
  const ids = [chatId, ...extras.filter((id) => id !== chatId)];
  const results = await Promise.all(ids.map((id) => sendMessage(token, id, text)));

  const anySent = results.some((r) => r.sent);
  const firstError = results.find((r) => !r.sent)?.error;
  return { sent: anySent, ...(firstError ? { error: firstError } : {}) };
}

// Технический бот — DevOps-отчёты, ошибки, алерты
export async function sendTechNotification(text: string): Promise<SendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN_TECH;
  const chatId = process.env.TELEGRAM_CHAT_ID_TECH;
  if (!token || !chatId) return { sent: false, error: "TELEGRAM_BOT_TOKEN_TECH/TELEGRAM_CHAT_ID_TECH не заданы" };
  return sendMessage(token, chatId, text);
}
