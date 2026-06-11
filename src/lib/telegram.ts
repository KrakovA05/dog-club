type SendResult = { sent: boolean; error?: string };

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

// Основной бот — брони, клиенты, бизнес-события
export async function sendTelegramNotification(text: string): Promise<SendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { sent: false, error: "TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID не заданы" };
  return sendMessage(token, chatId, text);
}

// Технический бот — DevOps-отчёты, ошибки, алерты
export async function sendTechNotification(text: string): Promise<SendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN_TECH;
  const chatId = process.env.TELEGRAM_CHAT_ID_TECH;
  if (!token || !chatId) return { sent: false, error: "TELEGRAM_BOT_TOKEN_TECH/TELEGRAM_CHAT_ID_TECH не заданы" };
  return sendMessage(token, chatId, text);
}
