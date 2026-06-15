import { createAdminClient as createClient } from "@/lib/supabase/admin";
import { StaffCalendarView, type BookingRow } from "./StaffCalendarView";
import { RefreshButton } from "@/components/admin/RefreshButton";

export const dynamic = "force-dynamic";

export default async function StaffCalendarPage() {
  const supabase = createClient();

  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id, service_type, daycare_format,
      start_date, end_date, status,
      pets(name, type, breed, weight_kg, special_needs, passport_photo_url),
      profiles(full_name),
      guest_name, guest_pet_name, guest_pet_type, guest_pet_breed
    `)
    .not("status", "in", "(cancelled,completed)")
    .order("start_date");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Календарь записей</h1>
        <RefreshButton />
      </div>
      <StaffCalendarView bookings={(bookings ?? []) as unknown as BookingRow[]} />
    </div>
  );
}
