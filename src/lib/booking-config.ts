// Даты открытия клиентской брони по виду питомца (МСК).
// До даты — плашка на /booking и отказ в server action.
// Откроется автоматически в указанный день, деплой не нужен.
export const BOOKING_OPENS = {
  dog: "2026-06-16",
  cat: "2026-07-01",
} as const;

// Человекочитаемые подписи для плашек и ошибок
export const BOOKING_OPENS_LABEL = {
  dog: "16 июня",
  cat: "1 июля",
} as const;

function todayMsk(): string {
  return new Date().toLocaleDateString("sv", { timeZone: "Europe/Moscow" });
}

export function isBookingOpenFor(type: "dog" | "cat"): boolean {
  return todayMsk() >= BOOKING_OPENS[type];
}

export function isAnyBookingOpen(): boolean {
  return isBookingOpenFor("dog") || isBookingOpenFor("cat");
}
