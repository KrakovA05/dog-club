export function register() {}

export async function onRequestError(
  err: { message?: string; name?: string; digest?: string },
  request: { path: string; method?: string },
  context: { routeType?: string }
) {
  // Пропускаем Next.js служебные "ошибки" (редиректы, 404)
  if (typeof err.digest === "string") {
    if (err.digest.startsWith("NEXT_NOT_FOUND")) return;
    if (err.digest.startsWith("NEXT_REDIRECT")) return;
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return;

  // Адрес Supabase — только из env (облачный fallback удалён вместе с облаком).
  // Без env лучше явная ошибка в логе, чем молчаливая запись в мёртвый хост.
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    console.error("[instrumentation] SUPABASE_URL не задан — ошибка не записана:", err.message);
    return;
  }

  // Прямой fetch без SDK — instrumentation не должен тянуть тяжёлые зависимости
  try {
    await fetch(`${supabaseUrl}/rest/v1/site_errors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        path: request.path,
        method: request.method ?? "GET",
        // 300 символов достаточно для диагностики; длинные тексты ошибок БД
        // могут содержать значения полей (в т.ч. ПДн) — не пишем их в логи
        error_message: (err.message ?? "Unknown error").slice(0, 300),
        error_name: err.name ?? "Error",
        route_type: context.routeType ?? null,
      }),
    });
  } catch {
    // Не роняем сервер если логирование недоступно
  }
}
