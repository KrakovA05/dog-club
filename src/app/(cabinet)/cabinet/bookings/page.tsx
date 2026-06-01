import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import Link from "next/link";
import { CancelBookingButton } from "@/components/cabinet/CancelBookingButton";
import type { Booking, BookingStatus } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Мои бронирования" };

const statusConfig: Record<
  BookingStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending:   { label: "Ожидает подтверждения", variant: "secondary" },
  confirmed: { label: "Подтверждено",          variant: "default" },
  cancelled: { label: "Отменено",              variant: "destructive" },
  completed: { label: "Завершено",             variant: "outline" },
};

const serviceLabels: Record<string, string> = {
  daycare: "Детский сад",
  hotel: "Гостиница",
};

const formatLabels: Record<string, string> = {
  hour: "Час",
  half_day: "Полдня",
  full_day: "Полный день",
};

export default async function BookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, pets(name, type, breed)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Мои бронирования</h1>
          <p className="text-muted-foreground text-sm mt-1">История заявок</p>
        </div>
        <Button size="sm" render={<Link href="/booking" />}>
          <Plus className="h-4 w-4 mr-1" />
          Новая заявка
        </Button>
      </div>

      {!bookings || bookings.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="mb-4">Заявок пока нет</p>
          <Button render={<Link href="/booking">Забронировать место</Link>} />
        </div>
      ) : (
        <div className="space-y-3">
          {(bookings as Booking[]).map((booking) => {
            const status = statusConfig[booking.status];
            const dateStr = booking.end_date
              ? `${booking.start_date} — ${booking.end_date}`
              : booking.start_date;

            return (
              <div key={booking.id} className="rounded-xl border p-5">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">
                        {serviceLabels[booking.service_type]}
                        {booking.daycare_format
                          ? ` — ${formatLabels[booking.daycare_format]}`
                          : ""}
                      </span>
                      <Badge variant={status.variant} className="text-xs">
                        {status.label}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {booking.pets?.name} · {dateStr}
                    </div>
                    {booking.notes && (
                      <div className="text-xs text-muted-foreground italic">
                        {booking.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {booking.price_total && (
                      <div className="text-primary font-bold">
                        {booking.price_total.toLocaleString("ru-RU")} ₽
                      </div>
                    )}
                    {booking.status === "pending" && (
                      <CancelBookingButton id={booking.id} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
