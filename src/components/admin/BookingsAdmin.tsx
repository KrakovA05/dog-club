"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { updateBookingStatus, updateBookingPrice } from "@/lib/admin-actions";
import type { BookingStatus } from "@/types";
import { Calendar, User, PawPrint, Clock, FileText } from "lucide-react";

const statusConfig: Record<BookingStatus, {
  label: string; next: BookingStatus | null; action: string;
  variant: "default" | "secondary" | "destructive" | "outline";
}> = {
  pending:   { label: "Ожидает подтверждения", next: "confirmed",  action: "Подтвердить", variant: "secondary" },
  confirmed: { label: "Подтверждено",          next: "completed",  action: "Завершить",   variant: "default" },
  completed: { label: "Завершено",             next: null,         action: "",            variant: "outline" },
  cancelled: { label: "Отменено",              next: null,         action: "",            variant: "destructive" },
};

const FORMAT_LABELS: Record<string, string> = {
  hour: "Час", half_day: "Полдня", full_day: "Полный день",
};

export interface BookingRow {
  id: string;
  service_type: string;
  daycare_format: string | null;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  status: BookingStatus;
  price_total: number | null;
  created_at: string;
  // Зарегистрированный клиент
  pets: {
    name: string;
    type: string;
    breed: string | null;
    weight_kg: number | null;
    special_needs: string | null;
    passport_full_name: string | null;
    passport_photo_url: string | null;
  } | null;
  profiles: { full_name: string | null; phone: string | null } | null;
  // Гостевой клиент (без регистрации)
  guest_name?: string | null;
  guest_phone?: string | null;
  guest_pet_name?: string | null;
  guest_pet_type?: string | null;
  guest_pet_breed?: string | null;
  guest_pet_weight?: number | null;
}

function PriceCell({ booking }: { booking: BookingRow }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(booking.price_total ?? ""));
  const savingRef = useRef(false);

  async function save() {
    if (savingRef.current) return;
    savingRef.current = true;
    const price = Number(value);
    if (!isNaN(price) && price > 0) {
      await updateBookingPrice(booking.id, price);
    }
    setEditing(false);
    savingRef.current = false;
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); save(); } }}
          autoFocus
          className="w-24 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <span className="text-sm text-muted-foreground">₽</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-sm font-semibold text-primary hover:underline"
      title="Нажмите чтобы указать сумму"
    >
      {booking.price_total ? `${booking.price_total.toLocaleString("ru-RU")} ₽` : "Указать сумму"}
    </button>
  );
}

function getDuration(b: BookingRow): string {
  if (b.service_type === "hotel" && b.end_date) {
    const start = new Date(b.start_date);
    const end = new Date(b.end_date);
    const days = Math.round((end.getTime() - start.getTime()) / 86400000);
    const mod10 = days % 10, mod100 = days % 100;
    const label = (mod100 >= 11 && mod100 <= 19) || mod10 >= 5 || mod10 === 0 ? "суток"
      : mod10 === 1 ? "сутки" : "суток";
    return `${days} ${label}`;
  }
  if (b.service_type === "daycare" && b.daycare_format) {
    return FORMAT_LABELS[b.daycare_format] ?? "";
  }
  return "";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

export function BookingsAdmin({ bookings }: { bookings: BookingRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ id: string; msg: string } | null>(null);

  async function changeStatus(id: string, status: BookingStatus) {
    setBusyId(id);
    setActionError(null);
    try {
      await updateBookingStatus(id, status);
      router.refresh();
    } catch (e) {
      setActionError({ id, msg: e instanceof Error ? e.message : "Не удалось изменить статус" });
    } finally {
      setBusyId(null);
    }
  }

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
        const duration = getDuration(b);

        return (
          <div key={b.id} className="bg-background rounded-xl border overflow-hidden">
            {/* Шапка карточки */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-muted/40 border-b">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant={sc.variant} className="text-xs">{sc.label}</Badge>
                <span className="text-xs text-muted-foreground">
                  #{b.id.slice(0, 8)} · подана {formatDate(b.created_at)}
                </span>
              </div>
              <div className="flex gap-2">
                {sc.next && (
                  <button type="button" onClick={() => changeStatus(b.id, sc.next!)} disabled={busyId === b.id}
                    className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                    {busyId === b.id ? "..." : sc.action}
                  </button>
                )}
                {b.status === "pending" && (
                  <button type="button" onClick={() => changeStatus(b.id, "cancelled")} disabled={busyId === b.id}
                    className="px-3 py-1.5 text-xs rounded-lg border hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 transition-colors">
                    Отменить
                  </button>
                )}
              </div>
            </div>

            {actionError?.id === b.id && (
              <div className="px-5 py-2 text-sm bg-destructive/10 text-destructive border-b">
                {actionError.msg}
              </div>
            )}

            {/* Тело */}
            <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Дата и тип */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <Calendar className="h-3.5 w-3.5" /> Визит
                </div>
                <div className="font-semibold text-sm">
                  {b.service_type === "hotel" ? "Гостиница" : "Детский сад"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(b.start_date)}
                  {b.end_date && ` — ${formatDate(b.end_date)}`}
                </div>
                {duration && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {duration}
                  </div>
                )}
              </div>

              {/* Клиент */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <User className="h-3.5 w-3.5" /> Клиент
                </div>
                {b.profiles ? (
                  <>
                    <div className="font-semibold text-sm">{b.profiles.full_name ?? "—"}</div>
                    {b.profiles.phone && (
                      <a href={`tel:${b.profiles.phone}`} className="text-sm text-primary hover:underline">
                        {b.profiles.phone}
                      </a>
                    )}
                  </>
                ) : b.guest_name ? (
                  <>
                    <div className="font-semibold text-sm">
                      {b.guest_name}
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">(без регистрации)</span>
                    </div>
                    {b.guest_phone && (
                      <a href={`tel:${b.guest_phone}`} className="text-sm text-primary hover:underline">
                        {b.guest_phone}
                      </a>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">—</div>
                )}
              </div>

              {/* Питомец */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <PawPrint className="h-3.5 w-3.5" /> Питомец
                </div>
                {b.pets ? (
                  <>
                    <div className="font-semibold text-sm">
                      {b.pets.name}
                      <span className="font-normal text-muted-foreground ml-1">
                        {b.pets.type === "dog" ? "собака" : b.pets.type === "cat" ? "кошка" : ""}
                      </span>
                    </div>
                    {b.pets.breed && <div className="text-xs text-muted-foreground">{b.pets.breed}</div>}
                    {b.pets.weight_kg && <div className="text-xs text-muted-foreground">{b.pets.weight_kg} кг</div>}
                    {b.pets.passport_full_name && (
                      <div className="text-xs text-muted-foreground">Владелец по паспорту: {b.pets.passport_full_name}</div>
                    )}
                    {!b.pets.passport_photo_url && (
                      <div className="text-xs text-red-600 font-medium">⚠ Паспорт не загружен</div>
                    )}
                    {b.pets.special_needs && (
                      <div className="text-xs text-orange-600 font-medium">{b.pets.special_needs}</div>
                    )}
                  </>
                ) : b.guest_pet_name ? (
                  <>
                    <div className="font-semibold text-sm">
                      {b.guest_pet_name}
                      <span className="font-normal text-muted-foreground ml-1">
                        {b.guest_pet_type === "dog" ? "собака" : b.guest_pet_type === "cat" ? "кошка" : ""}
                      </span>
                    </div>
                    {b.guest_pet_breed && <div className="text-xs text-muted-foreground">{b.guest_pet_breed}</div>}
                    {b.guest_pet_weight && <div className="text-xs text-muted-foreground">{b.guest_pet_weight} кг</div>}
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">—</div>
                )}
              </div>

              {/* Сумма и комментарий */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <FileText className="h-3.5 w-3.5" /> Итого
                </div>
                <PriceCell booking={b} />
                {b.notes && (
                  <div className="text-xs text-muted-foreground italic border-t pt-2 mt-1">
                    {b.notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
