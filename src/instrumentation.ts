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

  // Адрес Supabase. Server-only файл (browser-бандл его не видит), поэтому env
  // здесь безопасен — кэш сборки Amvera, из-за которого URL зашит в client.ts,
  // на NEXT_PUBLIC тут не влияет. Fallback — текущий облачный URL.
  const supabaseUrl = process.env.SUPABASE_URL ?? "https://zmvoaanwikhztpvdjpty.supabase.co";

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
        error_message: err.message ?? "Unknown error",
        error_name: err.name ?? "Error",
        route_type: context.routeType ?? null,
      }),
    });
  } catch {
    // Не роняем сервер если логирование недоступно
  }
}
