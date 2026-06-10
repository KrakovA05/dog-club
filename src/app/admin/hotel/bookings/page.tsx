import { createAdminClient as createClient } from "@/lib/supabase/admin";
import { BookingsAdmin, type BookingRow } from "@/components/admin/BookingsAdmin";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function HotelBookingsPage() {
  const supabase = createClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, pets(name, type, breed, weight_kg, special_needs, passport_full_name, passport_photo_url), profiles(full_name, phone)")
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
        <div className="flex gap-2">
          <Button size="sm" render={<Link href="/admin/bookings/new"><Plus className="h-4 w-4 mr-1" /> Записать клиента</Link>} />
          <Button size="sm" variant="outline" render={<Link href="/admin/daycare/bookings">← Детский сад</Link>} />
        </div>
      </div>
      <BookingsAdmin bookings={(bookings ?? []) as unknown as BookingRow[]} />
    </div>
  );
}
