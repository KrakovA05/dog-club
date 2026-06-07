"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMonthAvailability } from "@/lib/booking-actions";
import { parseLocalDate, toLocalDateStr, MONTHS, cn } from "@/lib/utils";

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function AvailabilityCalendar({
  serviceType,
  petType,
  startDate,
  endDate,
  onChange,
}: {
  serviceType: "daycare" | "hotel";
  petType: "dog" | "cat" | null;
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}) {
  const today = new Date();
  const todayStr = toLocalDateStr(today);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [remaining, setRemaining] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  // Загрузка доступности на видимый месяц
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!petType) { setRemaining({}); return; }
      const first = `${year}-${pad(month + 1)}-01`;
      const last = `${year}-${pad(month + 1)}-${pad(new Date(year, month + 1, 0).getDate())}`;
      setLoading(true);
      try {
        const rows = await getMonthAvailability({
          service_type: serviceType,
          pet_type: petType,
          start_date: first,
          end_date: last,
        });
        if (!cancelled) {
          const map: Record<string, number> = {};
          for (const r of rows) map[r.d] = r.remaining;
          setRemaining(map);
        }
      } catch {
        if (!cancelled) setRemaining({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [year, month, serviceType, petType]);

  function prev() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function next() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  // Свободен ли день (remaining неизвестен → считаем свободным, сервер перепроверит)
  function isFree(dateStr: string) {
    const r = remaining[dateStr];
    return r === undefined || r > 0;
  }

  // Есть ли занятая ночь в диапазоне [from, to) — для гостиницы
  function rangeHasFull(from: string, to: string): boolean {
    const cur = parseLocalDate(from);
    const end = parseLocalDate(to);
    while (cur < end) {
      const s = toLocalDateStr(cur);
      if (!isFree(s)) return true;
      cur.setDate(cur.getDate() + 1);
    }
    return false;
  }

  function handleClick(dateStr: string) {
    setHint(null);
    if (dateStr < todayStr) return;

    if (serviceType === "daycare") {
      if (!isFree(dateStr)) return;
      onChange(dateStr, "");
      return;
    }

    // Гостиница — выбор диапазона заезд–выезд
    const choosingStart = !startDate || (startDate && endDate);
    if (choosingStart) {
      if (!isFree(dateStr)) return; // заезд в занятый день нельзя
      onChange(dateStr, "");
      return;
    }
    // Выбираем выезд
    if (dateStr <= startDate) {
      onChange(dateStr, "");
      return;
    }
    if (rangeHasFull(startDate, dateStr)) {
      setHint("В выбранном промежутке есть занятые даты — выберите другой период");
      onChange(dateStr, ""); // начинаем заново с этой даты как заезд
      return;
    }
    onChange(startDate, dateStr);
  }

  // Подсветка диапазона гостиницы
  function inRange(dateStr: string) {
    if (serviceType !== "hotel" || !startDate || !endDate) return false;
    return dateStr > startDate && dateStr < endDate;
  }
  function isEdge(dateStr: string) {
    return dateStr === startDate || dateStr === endDate;
  }

  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Пн = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  if (!petType) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Выберите питомца, чтобы увидеть свободные даты
      </div>
    );
  }

  return (
    <div className="rounded-xl border overflow-hidden select-none">
      {/* Шапка */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b bg-muted/30">
        <button type="button" onClick={prev} className="p-1.5 rounded-lg hover:bg-muted transition-colors" aria-label="Предыдущий месяц">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold">{MONTHS[month]} {year}</span>
        <button type="button" onClick={next} className="p-1.5 rounded-lg hover:bg-muted transition-colors" aria-label="Следующий месяц">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Дни недели */}
      <div className="grid grid-cols-7 border-b">
        {DAYS.map((d, i) => (
          <div key={d} className={cn("py-1.5 text-center text-xs font-medium", i >= 5 ? "text-muted-foreground" : "text-foreground/70")}>
            {d}
          </div>
        ))}
      </div>

      {/* Сетка дней */}
      <div className={cn("grid grid-cols-7 transition-opacity", loading && "opacity-50")}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} className="h-11 border-r border-b last:border-r-0 bg-muted/10" />;
          const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
          const past = dateStr < todayStr;
          const free = isFree(dateStr);
          const r = remaining[dateStr];
          const selected = isEdge(dateStr);
          const ranged = inRange(dateStr);
          const disabled = past || (serviceType === "daycare" && !free) ||
            (serviceType === "hotel" && !free && (!startDate || (!!startDate && !!endDate)));

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => handleClick(dateStr)}
              disabled={disabled}
              title={!past && r !== undefined ? (free ? `Свободно: ${r}` : "Мест нет") : undefined}
              className={cn(
                "relative h-11 border-r border-b last:border-r-0 text-sm flex flex-col items-center justify-center transition-colors",
                disabled && "text-muted-foreground/40 cursor-not-allowed",
                !disabled && "hover:bg-primary/10 cursor-pointer",
                ranged && "bg-primary/10",
                selected && "bg-primary text-primary-foreground hover:bg-primary",
                !past && !free && !selected && "line-through decoration-destructive/50",
              )}
            >
              <span>{day}</span>
              {!past && free && !selected && r !== undefined && r <= 5 && (
                <span className="text-[9px] leading-none text-orange-500 font-medium">{r} мест</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Подсказка по выбору */}
      <div className="px-3 py-2 text-xs text-muted-foreground border-t bg-muted/20">
        {hint ? (
          <span className="text-destructive">{hint}</span>
        ) : serviceType === "hotel" ? (
          !startDate ? "Выберите дату заезда" : !endDate ? "Теперь выберите дату выезда" : "Период выбран"
        ) : (
          "Зачёркнутые дни — мест нет. Цифра — свободно мест"
        )}
      </div>
    </div>
  );
}
