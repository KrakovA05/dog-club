import { createClient } from "@supabase/supabase-js";

// URL проекта dog club. Не секрет — задаём константой, чтобы не зависеть
// от build-time инлайна NEXT_PUBLIC_* (Amvera кэширует слой сборки).
const SUPABASE_URL = "https://zmvoaanwikhztpvdjpty.supabase.co";

// Серверный клиент с service role — обходит RLS.
// Использовать ТОЛЬКО в серверных компонентах и Server Actions для /admin.
export function createAdminClient() {
  return createClient(
    SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
