import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function translateSupabaseError(message: string): string {
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
