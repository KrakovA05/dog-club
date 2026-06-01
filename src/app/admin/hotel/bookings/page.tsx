import { createAdminClient as createClient } from "@/lib/supabase/admin";
import { BookingsAdmin } from "@/components/admin/BookingsAdmin";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function HotelBookingsPage() {
  const supabase = createClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, pets(name, type, breed, weight_kg, special_needs, passport_full_name), profiles(full_name, phone)")
    .eq("service_type", "hotel")
    .order("created_at", { ascending: false });

  const pending = bookings?.filter((b) => b.status === "pending").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Гостиница — Заявки</h1>
          {pending > 0 && (
            <p className="text-sm text-orange-600 mt-1">{pending} ожидают подтверждения</p>
          )}
        </div>
        <Button size="sm" variant="outline" render={<Link href="/admin/daycare/bookings" />}>
          ← Детский сад
        </Button>
      </div>
      <BookingsAdmin bookings={(bookings as any[]) ?? []}  />
    </div>
  );
}
