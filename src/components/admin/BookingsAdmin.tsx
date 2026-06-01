import { Badge } from "@/components/ui/badge";
import { updateBookingStatus } from "@/lib/admin-actions";
import type { BookingStatus } from "@/types";

const statusConfig: Record<BookingStatus, { label: string; next: BookingStatus | null; action: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending:   { label: "Ожидает",      next: "confirmed",  action: "Подтвердить", variant: "secondary" },
  confirmed: { label: "Подтверждено", next: "completed",  action: "Завершить",   variant: "default" },
  completed: { label: "Завершено",    next: null,         action: "",            variant: "outline" },
  cancelled: { label: "Отменено",     next: null,         action: "",            variant: "destructive" },
};

const FORMAT_LABELS: Record<string, string> = {
  hour: "Час", half_day: "Полдня", full_day: "Полный день",
};

interface BookingRow {
  id: string;
  service_type: string;
  daycare_format: string | null;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  status: BookingStatus;
  price_total: number | null;
  pets: { name: string; type: string } | null;
  profiles: { full_name: string | null; phone: string | null } | null;
}

export function BookingsAdmin({ bookings, title }: { bookings: BookingRow[]; title: string }) {
  if (!bookings.length) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
        Заявок нет
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((b) => {
        const sc = statusConfig[b.status];
        const dateStr = b.end_date ? `${b.start_date} — ${b.end_date}` : b.start_date;

        return (
          <div key={b.id} className="bg-background rounded-xl border p-5">
            <div className="flex flex-wrap justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">
                    {b.daycare_format ? FORMAT_LABELS[b.daycare_format] : "Проживание"}
                  </span>
                  <Badge variant={sc.variant} className="text-xs">{sc.label}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Питомец: <strong>{b.pets?.name ?? "—"}</strong> · {dateStr}
                </div>
                <div className="text-sm text-muted-foreground">
                  Хозяин: {b.profiles?.full_name ?? "—"}
                  {b.profiles?.phone ? ` · ${b.profiles.phone}` : ""}
                </div>
                {b.notes && (
                  <div className="text-xs text-muted-foreground italic">{b.notes}</div>
                )}
                {b.price_total && (
                  <div className="text-sm font-semibold text-primary">
                    {b.price_total.toLocaleString("ru-RU")} ₽
                  </div>
                )}
              </div>

              <div className="flex gap-2 items-start shrink-0">
                {sc.next && (
                  <form action={updateBookingStatus.bind(null, b.id, sc.next)}>
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      {sc.action}
                    </button>
                  </form>
                )}
                {b.status === "pending" && (
                  <form action={updateBookingStatus.bind(null, b.id, "cancelled")}>
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-sm rounded-lg border hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      Отменить
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
