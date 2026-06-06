import { createBrowserClient } from "@supabase/ssr";

// Публичные значения проекта dog club. Не секреты (anon-ключ и URL всё равно
// уходят в браузер). Заданы константами, чтобы не зависеть от build-time инлайна
// NEXT_PUBLIC_* — Amvera кэширует слой сборки и впекает старые значения.
export const SUPABASE_URL = "https://zmvoaanwikhztpvdjpty.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptdm9hYW53aWtoenRwdmRqcHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjUxNTIsImV4cCI6MjA5NTkwMTE1Mn0.29wddCRDW2Kat5lWcJkxYAhH56F1xaU2Ff5_fSZjShg";

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
