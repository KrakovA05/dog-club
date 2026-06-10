import { createAdminClient as createClient } from "@/lib/supabase/admin";
import { CalendarView, type BookingRow } from "./CalendarView";
import { RefreshButton } from "@/components/admin/RefreshButton";

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage() {
  const supabase = createClient();

  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id, pet_id, service_type, daycare_format,
      start_date, end_date, status,
      pets(name, type, breed, passport_photo_url),
      profiles(full_name, phone)
    `)
    .not("status", "eq", "cancelled")
    .order("start_date");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Календарь записей</h1>
        <RefreshButton />
      </div>
      <CalendarView bookings={(bookings ?? []) as unknown as BookingRow[]} />
    </div>
  );
}
