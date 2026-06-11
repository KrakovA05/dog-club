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

async function getAiComment(apiKey: string, context: string): Promise<string> {
  try {
    const prompt = `Ты — технический ассистент зоопансиона «Лапа Клуб». Оцени техническое состояние системы. Напиши 1-2 предложения: всё ли в норме, есть ли поводы для беспокойства. Кратко, без вступлений, без markdown.`;

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

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const [uptime, dbCheck] = await Promise.all([
    checkSiteUptime(),
    // Проверка доступности БД — лёгкий запрос
    supabase.from("profiles").select("id", { count: "exact", head: true }).limit(1),
  ]);

  const dbOk = !dbCheck.error;

  const statsContext = `
Дата: ${todayStr}
Сайт: ${uptime.ok ? `доступен (${uptime.ms}ms)` : "НЕДОСТУПЕН"}
База данных: ${dbOk ? "доступна" : `ошибка: ${dbCheck.error?.message}`}
`.trim();

  const aiComment = await getAiComment(apiKey, statsContext);

  const statusIcon = uptime.ok ? "✅" : "🔴";
  const dbIcon = dbOk ? "✅" : "🔴";

  const message = [
    `🔧 <b>Техотчёт — ${todayStr}</b>`,
    "",
    `${statusIcon} Сайт: ${uptime.ok ? `доступен (${uptime.ms}ms)` : "<b>НЕДОСТУПЕН!</b>"}`,
    `${dbIcon} База данных: ${dbOk ? "в норме" : `<b>ошибка!</b> ${dbCheck.error?.message}`}`,
    "",
    aiComment ? `📌 <i>${aiComment}</i>` : null,
  ]
    .filter((line) => line !== null)
    .join("\n");

  await sendTechNotification(message);

  return NextResponse.json({ ok: true, date: todayStr });
}
