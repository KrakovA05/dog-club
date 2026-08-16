import { createBrowserClient } from "@supabase/ssr";

// Публичные значения self-hosted Supabase. Сервер БД — Timeweb Cloud, РФ
// (93.183.82.170, netname TW-Cloud): локализация по ч.5 ст.18 152-ФЗ.
// Само приложение живёт на Amvera — не путать площадки.
// Не секреты (anon-ключ и URL всё равно уходят в браузер). Заданы константами,
// чтобы не зависеть от build-time инлайна NEXT_PUBLIC_* — Amvera кэширует слой
// сборки и впекает старые значения.
export const SUPABASE_URL = "https://db.lapaclub.ru";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzgzMDg5MzQzLCJleHAiOjIwOTg0NDkzNDN9.lJMEWr1jFCQY3FT6GVftfiBk9X5EuXdbNU5Rht-NGIw";

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
