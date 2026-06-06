import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// URL проекта dog club — константой (см. admin.ts).
const SUPABASE_URL = "https://zmvoaanwikhztpvdjpty.supabase.co";

// Динамическое чтение env в рантайме (через переменную имя не инлайнится при сборке).
function runtimeEnv(name: string) {
  return process.env[name];
}

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    SUPABASE_URL,
    runtimeEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
