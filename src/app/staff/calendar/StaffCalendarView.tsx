"use client";
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  service_type: string;
  daycare_format: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
  pets: {
    name: string;
    type: string;
    breed: string | null;
    weight_kg: number | null;
    special_needs: string | null;
    passport_photo_url: string | null;
  } | null;
  profiles: { full_name: string | null } | null;
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

export function StaffCalendarView({ bookings }: { bookings: BookingRow[] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  function prev() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function next() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const bookingsByDate = useMemo(() => {
    const map: Record<string, BookingRow[]> = {};
    for (const b of bookings) {
      for (const d of getDatesInRange(b.start_date, b.end_date)) {
        if (!map[d]) map[d] = [];
        map[d].push(b);
      }
    }
    return map;
  }, [bookings]);

  const firstDay = new Date(year, month, 1);
  const startDow = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = toLocalDateStr(today);

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedBookings = selected ? (bookingsByDate[selected] ?? []) : [];

  return (
    <div className="space-y-6">
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

      <div className="flex gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />Ожидает</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Подтверждено</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" />Завершено</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="bg-background rounded-2xl border overflow-hidden">
          <div className="grid grid-cols-7 border-b">
            {DAYS.map((d, i) => (
              <div key={d} className={`py-2.5 text-center text-xs font-semibold ${i >= 5 ? "text-muted-foreground" : ""}`}>
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (!day) return <div key={`e-${idx}`} className="border-r border-b h-20 bg-muted/20 last:border-r-0" />;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayBookings = bookingsByDate[dateStr] ?? [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selected;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelected(isSelected ? null : dateStr)}
                  className={`border-r border-b h-20 p-1.5 text-left transition-colors relative last:border-r-0 ${isSelected ? "bg-primary/8 ring-2 ring-inset ring-primary" : "hover:bg-muted/40"} ${idx % 7 >= 5 ? "bg-muted/10" : ""}`}
                >
                  <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "bg-primary text-primary-foreground" : ""}`}>
                    {day}
                  </span>
                  {dayBookings.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-0.5">
                      {dayBookings.slice(0, 3).map((b) => (
                        <span key={b.id + dateStr} className={`w-2 h-2 rounded-full ${STATUS_COLORS[b.status] ?? "bg-gray-300"}`} />
                      ))}
                      {dayBookings.length > 3 && <span className="text-xs text-muted-foreground">+{dayBookings.length - 3}</span>}
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

        {selected ? (
          <div className="bg-background rounded-2xl border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <span className="font-semibold">{formatCalendarDate(selected)}</span>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            {selectedBookings.length === 0 ? (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">Записей нет</div>
            ) : (
              <div className="divide-y">
                {selectedBookings.map((b) => {
                  const isHotel = b.service_type === "hotel";
                  const duration = isHotel && b.end_date
                    ? `${Math.round((new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / 86400000)} сут.`
                    : b.daycare_format ? FORMAT_LABELS[b.daycare_format] : "";

                  return (
                    <div key={b.id} className="px-5 py-4 space-y-3">
                      {/* Тип и статус */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_COLORS[b.status] ?? "bg-gray-300"}`} />
                          <span className="font-medium text-sm">{isHotel ? "Гостиница" : "Детский сад"}</span>
                          {duration && <span className="text-xs text-muted-foreground">{duration}</span>}
                        </div>
                        <Badge variant={b.status === "confirmed" ? "default" : b.status === "pending" ? "secondary" : "outline"} className="text-xs">
                          {b.status === "pending" ? "Ожидает" : b.status === "confirmed" ? "Подтверждено" : "Завершено"}
                        </Badge>
                      </div>

                      {/* Данные питомца */}
                      <div className="bg-muted/30 rounded-xl p-3 space-y-1.5 text-sm">
                        <div className="font-semibold">
                          {b.pets?.name ?? "—"}
                          <span className="font-normal text-muted-foreground ml-1.5 text-xs">
                            {b.pets?.type === "dog" ? "собака" : "кошка"}
                            {b.pets?.breed ? ` · ${b.pets.breed}` : ""}
                          </span>
                        </div>
                        {b.pets?.weight_kg && (
                          <div className="text-xs text-muted-foreground">Вес: {b.pets.weight_kg} кг</div>
                        )}
                        {b.pets?.special_needs && (
                          <div className="text-xs font-medium text-orange-600">{b.pets.special_needs}</div>
                        )}
                        {b.pets?.passport_photo_url && (
                          <a href={b.pets.passport_photo_url} target="_blank" rel="noopener noreferrer"
                            className="inline-block mt-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={b.pets.passport_photo_url} alt="Паспорт"
                              className="h-16 w-auto rounded-lg border object-cover hover:opacity-90 transition-opacity" />
                          </a>
                        )}
                      </div>

                      {/* Только имя владельца */}
                      <div className="text-xs text-muted-foreground">
                        Владелец: <span className="text-foreground font-medium">{b.profiles?.full_name ?? "—"}</span>
                      </div>
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
