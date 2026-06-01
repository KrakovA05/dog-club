import { createClient } from "@supabase/supabase-js";

// Серверный клиент с service role — обходит RLS.
// Использовать ТОЛЬКО в серверных компонентах и Server Actions для /admin.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
