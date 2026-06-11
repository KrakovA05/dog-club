async function sendMessage(token: string, chatId: string, text: string): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
  } catch {
    // не роняем сервер если Telegram недоступен
  }
}

// Основной бот — брони, клиенты, бизнес-события
export async function sendTelegramNotification(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  await sendMessage(token, chatId, text);
}

// Технический бот — DevOps-отчёты, ошибки, алерты
export async function sendTechNotification(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN_TECH;
  const chatId = process.env.TELEGRAM_CHAT_ID_TECH;
  if (!token || !chatId) return;
  await sendMessage(token, chatId, text);
}
