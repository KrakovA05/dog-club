import { Zap, AlertTriangle } from "lucide-react";

// Российские праздники (месяц 0-based, день)
const RU_HOLIDAYS: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], // Новый год
  [0, 8],  // Рождество
  [1, 23], // День защитника
  [2, 8],  // 8 марта
  [4, 1], [4, 2], [4, 9], [4, 10], [4, 11], // Майские
  [5, 12], // День России
  [10, 4], // День народного единства
];

function getDaysUntil(month: number, day: number, now: Date): number {
  const target = new Date(now.getFullYear(), month, day);
  if (target < now) target.setFullYear(now.getFullYear() + 1);
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

function getUrgencyMessage(): { text: string; level: "high" | "medium" } {
  const now = new Date();
  const dow = now.getDay(); // 0=вс, 1=пн ... 6=сб

  // Проверяем ближайшие праздники
  for (const [m, d] of RU_HOLIDAYS) {
    const days = getDaysUntil(m, d, now);
    if (days <= 5 && days > 0) {
      return {
        text: `До праздников ${days} ${days === 1 ? "день" : days < 5 ? "дня" : "дней"} — места на этот период почти заняты`,
        level: "high",
      };
    }
  }

  // Четверг или пятница — перед выходными
  if (dow === 4 || dow === 5) {
    return {
      text: "Места на выходные заполняются — бронируйте сегодня",
      level: "high",
    };
  }

  // Начало недели
  if (dow === 1 || dow === 2) {
    return {
      text: "Свободные места на эту неделю ограничены — бронируйте заранее",
      level: "medium",
    };
  }

  return {
    text: "Места на ближайшие дни ограничены — бронируйте заранее",
    level: "medium",
  };
}

export function UrgencyBanner() {
  const { text, level } = getUrgencyMessage();
  const isHigh = level === "high";

  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium
      ${isHigh
        ? "bg-red-50 border border-red-200 text-red-800"
        : "bg-amber-50 border border-amber-200 text-amber-800"
      }`}
    >
      {isHigh
        ? <AlertTriangle className="h-4 w-4 fill-red-400 text-red-400 shrink-0" />
        : <Zap className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" />
      }
      {text}
    </div>
  );
}
