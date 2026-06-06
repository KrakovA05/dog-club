import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./client";

// Серверный клиент с service role — обходит RLS.
// Использовать ТОЛЬКО в серверных компонентах и Server Actions для /admin.
export function createAdminClient() {
  return createClient(
    SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
