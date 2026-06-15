import { createAdminClient as createClient } from "@/lib/supabase/admin";
import { BookingsAdmin, type BookingRow } from "@/components/admin/BookingsAdmin";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function DaycareBookingsPage() {
  const supabase = createClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, pets(name, type, breed, weight_kg, special_needs, passport_full_name, passport_photo_url), profiles(full_name, phone), guest_name, guest_phone, guest_pet_name, guest_pet_type, guest_pet_breed, guest_pet_weight")
    .eq("service_type", "daycare")
    .order("created_at", { ascending: false });

  const pending = bookings?.filter((b) => b.status === "pending").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Детский сад — Заявки</h1>
          {pending > 0 && (
            <p className="text-sm text-orange-600 mt-1">{pending} ожидают подтверждения</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" render={<Link href="/admin/bookings/new"><Plus className="h-4 w-4 mr-1" /> Записать клиента</Link>} />
          <Button size="sm" variant="outline" render={<Link href="/admin/hotel/bookings">Гостиница →</Link>} />
        </div>
      </div>
      <BookingsAdmin bookings={(bookings ?? []) as unknown as BookingRow[]} />
    </div>
  );
}
