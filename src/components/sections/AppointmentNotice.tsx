import { CalendarClock } from "lucide-react";

/** Заметная плашка: приём строго по предварительной записи. */
export function AppointmentNotice() {
  return (
    <section className="bg-amber-50 border-y border-amber-300">
      <div className="container mx-auto max-w-4xl px-4 py-4 flex items-center justify-center gap-3 text-center">
        <CalendarClock className="h-5 w-5 md:h-6 md:w-6 text-amber-700 shrink-0" />
        <p className="text-sm md:text-base font-semibold text-amber-800">
          Приём строго по предварительной записи. Просто прийти без брони нельзя —
          дождитесь звонка администратора с подтверждением.
        </p>
      </div>
    </section>
  );
}
