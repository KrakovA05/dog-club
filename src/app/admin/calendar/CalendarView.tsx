"use client";
import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X, FileCheck, FileX, Link2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { updateBookingStatus } from "@/lib/admin-actions";
import { parseLocalDate, toLocalDateStr, formatCalendarDate, MONTHS } from "@/lib/utils";

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const FORMAT_LABELS: Record<string, string> = {
  hour: "Час", half_day: "Полдня", full_day: "Полный день",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-orange-400",
  confirmed: "bg-green-500",
  completed: "bg-gray-400",
};

export interface BookingRow {
  id: string;
  pet_id: string | null;
  service_type: string;
  daycare_format: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
  pets: { name: string; type: string; breed: string | null; passport_photo_url: string | null } | null;
  profiles: { full_name: string | null; phone: string | null } | null;
  guest_name?: string | null;
  guest_phone?: string | null;
  guest_pet_name?: string | null;
  guest_pet_type?: string | null;
  guest_pet_breed?: string | null;
}

function getDatesInRange(start: string, end: string | null): string[] {
  const dates: string[] = [];
  const cur = parseLocalDate(start);
  const last = end ? parseLocalDate(end) : parseLocalDate(start);
  while (cur <= last) {
    dates.push(toLocalDateStr(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export function CalendarView({ bookings }: { bookings: BookingRow[] }) {
  const today = new Date();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [paymentBookingId, setPaymentBookingId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  async function handleStatus(id: string, status: "confirmed" | "cancelled" | "completed") {
    setLoadingId(id);
    setActionError(null);
    try {
      await updateBookingStatus(id, status);
      startTransition(() => router.refresh());
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Не удалось изменить статус");
    } finally {
      setLoadingId(null);
    }
  }

  function prev() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function next() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  // Map date → bookings
  const bookingsByDate = useMemo(() => {
    const map: Record<string, BookingRow[]> = {};
    for (const b of bookings) {
      const dates = getDatesInRange(b.start_date, b.end_date);
      for (const d of dates) {
        if (!map[d]) map[d] = [];
        map[d].push(b);
      }
    }
    return map;
  }, [bookings]);

  // Build calendar grid
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Monday-based: getDay() 0=Sun → shift
  const startDow = (firstDay.getDay() + 6) % 7; // 0=Mon
  const daysInMonth = lastDay.getDate();
  const todayStr = toLocalDateStr(today);

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedBookings = selected ? (bookingsByDate[selected] ?? []) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={prev} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-lg font-semibold w-44 text-center">
          {MONTHS[month]} {year}
        </span>
        <button onClick={next} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ChevronRight className="h-5 w-5" />
        </button>
        <button
          onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()); }}
          className="ml-2 px-3 py-1.5 text-sm rounded-lg border hover:bg-muted transition-colors"
        >
          Сегодня
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />Ожидает</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Подтверждено</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" />Завершено</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* Calendar grid */}
        <div className="bg-background rounded-2xl border overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b">
            {DAYS.map((d, i) => (
              <div key={d} className={`py-2.5 text-center text-xs font-semibold ${i >= 5 ? "text-muted-foreground" : "text-foreground"}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="border-r border-b h-20 bg-muted/20 last:border-r-0" />;
              }
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayBookings = bookingsByDate[dateStr] ?? [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selected;
              const isWeekend = (idx % 7) >= 5;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelected(isSelected ? null : dateStr)}
                  className={`
                    border-r border-b h-20 p-1.5 text-left transition-colors relative
                    last:border-r-0
                    ${isSelected ? "bg-primary/8 ring-2 ring-inset ring-primary" : "hover:bg-muted/40"}
                    ${isWeekend ? "bg-muted/10" : ""}
                  `}
                >
                  <span className={`
                    text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                    ${isToday ? "bg-primary text-primary-foreground" : ""}
                  `}>
                    {day}
                  </span>

                  {dayBookings.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-0.5">
                      {dayBookings.slice(0, 3).map((b) => (
                        <span
                          key={b.id + dateStr}
                          className={`w-2 h-2 rounded-full ${STATUS_COLORS[b.status] ?? "bg-gray-300"}`}
                          title={`${b.pets?.name ?? b.guest_pet_name ?? "—"} — ${b.service_type === "hotel" ? "Гостиница" : "Сад"}`}
                        />
                      ))}
                      {dayBookings.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{dayBookings.length - 3}</span>
                      )}
                    </div>
                  )}

                  {dayBookings.length > 0 && (
                    <span className="absolute bottom-1 right-1.5 text-xs font-medium text-muted-foreground">
                      {dayBookings.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar — selected day */}
        {selected ? (
          <div className="bg-background rounded-2xl border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <span className="font-semibold">{formatCalendarDate(selected)}</span>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <Link
              href={`/admin/bookings/new?date=${selected}`}
              className="flex items-center justify-center gap-1.5 mx-5 mt-3 px-3 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" /> Записать на этот день
            </Link>

            {actionError && (
              <div className="mx-5 mt-3 text-sm bg-destructive/10 text-destructive px-3 py-2 rounded-lg">
                {actionError}
              </div>
            )}

            {selectedBookings.length === 0 ? (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">
                Записей нет
              </div>
            ) : (
              <div className="divide-y">
                {selectedBookings.map((b) => {
                  const isHotel = b.service_type === "hotel";
                  const duration = isHotel && b.end_date
                    ? (() => {
                        const diff = (new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / 86400000;
                        return `${Math.round(diff)} сут.`;
                      })()
                    : b.daycare_format ? FORMAT_LABELS[b.daycare_format] : "";

                  return (
                    <div key={b.id} className="px-5 py-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_COLORS[b.status] ?? "bg-gray-300"}`} />
                          <span className="font-medium text-sm">
                            {isHotel ? "Гостиница" : "Детский сад"}
                          </span>
                          {duration && (
                            <span className="text-xs text-muted-foreground">{duration}</span>
                          )}
                        </div>
                        <Badge
                          variant={b.status === "confirmed" ? "default" : b.status === "pending" ? "secondary" : "outline"}
                          className="text-xs shrink-0"
                        >
                          {b.status === "pending" ? "Ожидает" : b.status === "confirmed" ? "Подтверждено" : "Завершено"}
                        </Badge>
                      </div>

                      <div className="text-sm space-y-0.5 pl-4">
                        <div>
                          <span className="text-muted-foreground">Питомец: </span>
                          <span className="font-medium">{b.pets?.name ?? b.guest_pet_name ?? "—"}</span>
                          {(b.pets?.breed ?? b.guest_pet_breed) && (
                            <span className="text-muted-foreground"> · {b.pets?.breed ?? b.guest_pet_breed}</span>
                          )}
                        </div>
                        {b.pets ? (
                          <div className="flex items-center gap-1.5">
                            {b.pets.passport_photo_url ? (
                              <a
                                href={`/api/passport/${b.pet_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-green-600 hover:underline"
                              >
                                <FileCheck className="h-3.5 w-3.5" />
                                Паспорт прикреплён
                              </a>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-orange-500">
                                <FileX className="h-3.5 w-3.5" />
                                Паспорт не загружен
                              </span>
                            )}
                          </div>
                        ) : b.guest_name ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <FileX className="h-3.5 w-3.5" />
                            Без регистрации — паспорт проверить при приёме
                          </div>
                        ) : null}
                        <div>
                          <span className="text-muted-foreground">Хозяин: </span>
                          <span>{b.profiles?.full_name ?? b.guest_name ?? "—"}</span>
                          {!b.profiles && b.guest_name && (
                            <span className="text-xs text-muted-foreground"> (без регистрации)</span>
                          )}
                        </div>
                        {(b.profiles?.phone ?? b.guest_phone) && (
                          <div>
                            <a href={`tel:${b.profiles?.phone ?? b.guest_phone}`} className="text-primary text-xs hover:underline">
                              {b.profiles?.phone ?? b.guest_phone}
                            </a>
                          </div>
                        )}
                        {isHotel && b.end_date && (
                          <div className="text-xs text-muted-foreground">
                            {b.start_date} → {b.end_date}
                          </div>
                        )}
                      </div>

                      {/* Кнопки действий */}
                      {(b.status === "pending" || b.status === "confirmed") && (
                        <div className="flex flex-wrap gap-2 pl-4 pt-1">
                          {b.status === "pending" && (
                            <button
                              onClick={() => handleStatus(b.id, "confirmed")}
                              disabled={loadingId === b.id || isPending}
                              className="px-3 py-1 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            >
                              {loadingId === b.id ? "..." : "Подтвердить"}
                            </button>
                          )}
                          {b.status === "confirmed" && (
                            <button
                              onClick={() => handleStatus(b.id, "completed")}
                              disabled={loadingId === b.id || isPending}
                              className="px-3 py-1 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            >
                              {loadingId === b.id ? "..." : "Завершить"}
                            </button>
                          )}
                          <button
                            onClick={() => handleStatus(b.id, "cancelled")}
                            disabled={loadingId === b.id || isPending}
                            className="px-3 py-1 text-xs rounded-lg border hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 transition-colors"
                          >
                            Отменить
                          </button>
                          <button
                            onClick={() => { setPaymentBookingId(b.id); setPaymentAmount(""); }}
                            className="px-3 py-1 text-xs rounded-lg border hover:bg-muted transition-colors flex items-center gap-1"
                          >
                            <Link2 className="h-3 w-3" /> Оплата
                          </button>
                        </div>
                      )}

                      {/* Блок формирования ссылки на оплату */}
                      {paymentBookingId === b.id && (
                        <div className="ml-4 mt-2 p-3 rounded-xl bg-muted/50 border space-y-2">
                          <p className="text-xs font-medium">Сумма к оплате (₽)</p>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              placeholder="1800"
                              className="flex h-8 w-24 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                            <button
                              onClick={() => {
                                const service = b.service_type === "hotel" ? "Гостиница" : "Детский сад";
                                const pet = b.pets?.name ?? "питомец";
                                const date = b.start_date;
                                const amount = paymentAmount || "—";
                                const msg = `Лапа Клуб — оплата услуги\n${service}: ${pet}\nДата: ${date}\nСумма: ${amount} ₽\n\nРеквизиты уточните у администратора`;
                                navigator.clipboard.writeText(msg);
                                setPaymentBookingId(null);
                              }}
                              className="px-3 py-1 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                              Скопировать
                            </button>
                            <button
                              onClick={() => setPaymentBookingId(null)}
                              className="px-2 py-1 text-xs rounded-lg border hover:bg-muted transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-muted/30 rounded-2xl border border-dashed p-8 text-center text-muted-foreground text-sm">
            Нажмите на день<br />чтобы увидеть записи
          </div>
        )}
      </div>
    </div>
  );
}
