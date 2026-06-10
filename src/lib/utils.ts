import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function translateSupabaseError(message: string): string {
  // Отказ по вместимости из триггера БД: CAPACITY_FULL|YYYY-MM-DD|zone
  if (message.includes("CAPACITY_FULL")) {
    const match = message.match(/CAPACITY_FULL\|(\d{4}-\d{2}-\d{2})/);
    if (match) return `На ${formatCalendarDate(match[1])} свободных мест нет — выберите другую дату.`;
    return "На выбранную дату свободных мест нет — выберите другую.";
  }
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("invalid email or password")) return "Неверный email или пароль.";
  if (m.includes("email not confirmed")) return "Подтвердите email — проверьте почту.";
  if (m.includes("already registered") || m.includes("user already exists")) return "Этот email уже зарегистрирован. Войдите или восстановите пароль.";
  if (m.includes("password should be at least")) return "Пароль слишком короткий — минимум 6 символов.";
  if (m.includes("new password should be different")) return "Новый пароль должен отличаться от старого.";
  if (m.includes("auth session missing") || m.includes("session")) return "Сессия истекла — войдите снова.";
  if (m.includes("token has expired") || m.includes("token is invalid")) return "Ссылка устарела или недействительна.";
  if (m.includes("rate limit") || m.includes("too many requests") || m.includes("after")) return "Слишком много попыток — подождите немного.";
  if (m.includes("network") || m.includes("fetch")) return "Ошибка сети — проверьте подключение.";
  if (m.includes("unable to validate email")) return "Некорректный формат email.";
  if (m.includes("signup")) return "Не удалось создать аккаунт — попробуйте позже.";
  return "Что-то пошло не так — попробуйте ещё раз.";
}

// Выбор суточной цены гостиницы по виду питомца и количеству ночей.
// Тиры: «от пяти» (≥5 ночей), «от трёх» (≥3), базовая (1+).
// Доп.услуги («дрессировка», «+») в авто-расчёт не берём. Фолбэк — первая обычная строка.
export function pickHotelNightly(
  petType: "dog" | "cat",
  rows: { label: string; price: number }[],
  nights = 1,
): number {
  const species = petType === "cat" ? /кошк/i : /собак/i;
  const tier = rows.filter((r) => species.test(r.label) && !/дрессир/i.test(r.label));
  if (!tier.length) {
    const base = rows.find((r) => !/дрессир|\+/i.test(r.label)) ?? rows[0];
    return base?.price ?? 0;
  }
  const fivePlus  = tier.find((r) => /от.*пят|5\+/i.test(r.label));
  const threePlus = tier.find((r) => /от.*тр[её]|3\+/i.test(r.label));
  const base      = tier.find((r) => !/от\s/i.test(r.label)) ?? tier[0];
  if (nights >= 5 && fivePlus)  return fivePlus.price;
  if (nights >= 3 && threePlus) return threePlus.price;
  return base.price;
}

export function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toLocalDateStr(date: Date): string {
  return date.toLocaleDateString("sv");
}

export const MONTHS = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];

export function formatCalendarDate(d: string): string {
  const [, m, day] = d.split("-");
  return `${parseInt(day)} ${MONTHS[parseInt(m) - 1]}`;
}
