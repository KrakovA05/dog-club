import { createClient } from "@/lib/supabase/server";
import { StaffCalendarView } from "./StaffCalendarView";
import { RefreshButton } from "@/components/admin/RefreshButton";

export const dynamic = "force-dynamic";

export default async function StaffCalendarPage() {
  const supabase = await createClient();

  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id, service_type, daycare_format,
      start_date, end_date, status,
      pets(name, type, breed, weight_kg, special_needs, passport_photo_url),
      profiles(full_name)
    `)
    .not("status", "eq", "cancelled")
    .order("start_date");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Календарь записей</h1>
        <RefreshButton />
      </div>
      <StaffCalendarView bookings={(bookings as any[]) ?? []} />
    </div>
  );
}
