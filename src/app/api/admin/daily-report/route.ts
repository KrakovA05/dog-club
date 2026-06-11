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

type ErrorRow = { path: string; method: string; error_message: string; error_name: string; count?: number };

async function getAiAnalysis(apiKey: string, context: string, errors: ErrorRow[]): Promise<string> {
  try {
    const hasErrors = errors.length > 0;
    const errorList = errors
      .map((e) => `- ${e.count ?? 1}x ${e.method} ${e.path} — ${e.error_name}: ${e.error_message}`)
      .join("\n");

    const prompt = hasErrors
      ? `Ты — технический ассистент зоопансиона «Лапа Клуб» (Next.js + Supabase).
Проанализируй ошибки за сегодня и дай конкретные рекомендации по исправлению каждой.
Для каждой ошибки — 1 предложение с конкретным действием (что проверить, что изменить).
Без вступлений, без markdown, только текст.

${context}

Ошибки:
${errorList}`
      : `Ты — технический ассистент зоопансиона «Лапа Клуб». Оцени техническое состояние за сегодня в 1 предложении. Без вступлений, без markdown.

${context}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
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

  const [uptime, dbCheck, errorsResult] = await Promise.all([
    checkSiteUptime(),
    supabase.from("profiles").select("id", { count: "exact", head: true }).limit(1),
    supabase
      .from("site_errors")
      .select("path, method, error_message, error_name")
      .gte("created_at", todayStr + "T00:00:00")
      .lte("created_at", todayStr + "T23:59:59")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const dbOk = !dbCheck.error;
  const rawErrors = (errorsResult.data ?? []) as ErrorRow[];

  // Группируем одинаковые ошибки
  const errorMap = new Map<string, ErrorRow & { count: number }>();
  for (const e of rawErrors) {
    const key = `${e.method}:${e.path}:${e.error_name}:${e.error_message}`;
    const existing = errorMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      errorMap.set(key, { ...e, count: 1 });
    }
  }
  const errors = Array.from(errorMap.values()).sort((a, b) => b.count - a.count);

  const statsContext = `
Дата: ${todayStr}
Сайт: ${uptime.ok ? `доступен (${uptime.ms}ms)` : "НЕДОСТУПЕН"}
База данных: ${dbOk ? "доступна" : `ошибка: ${dbCheck.error?.message}`}
Ошибок за день: ${rawErrors.length}
`.trim();

  const aiAnalysis = await getAiAnalysis(apiKey, statsContext, errors);

  const statusIcon = uptime.ok ? "✅" : "🔴";
  const dbIcon = dbOk ? "✅" : "🔴";

  const errorsBlock = errors.length === 0
    ? ["⚡️ Ошибок за день: нет"]
    : [
        `⚠️ <b>Ошибок за день: ${rawErrors.length} (${errors.length} уник.)</b>`,
        "",
        ...errors.slice(0, 10).map(
          (e) => `  ${e.count > 1 ? `${e.count}x ` : ""}${e.method} ${e.path}\n  └ ${e.error_name}: ${e.error_message.slice(0, 80)}`
        ),
      ];

  const message = [
    `🔧 <b>Техотчёт — ${todayStr}</b>`,
    "",
    `${statusIcon} Сайт: ${uptime.ok ? `доступен (${uptime.ms}ms)` : "<b>НЕДОСТУПЕН!</b>"}`,
    `${dbIcon} База данных: ${dbOk ? "в норме" : `<b>ошибка!</b> ${dbCheck.error?.message}`}`,
    "",
    ...errorsBlock,
    "",
    aiAnalysis ? `📌 <i>${aiAnalysis}</i>` : null,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const result = await sendTechNotification(message);

  return NextResponse.json({ ok: true, date: todayStr, telegram: result });
}
