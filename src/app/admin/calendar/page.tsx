import { createClient } from "@/lib/supabase/server";
import { CalendarView } from "./CalendarView";
import { RefreshButton } from "@/components/admin/RefreshButton";

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage() {
  const supabase = await createClient();

  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id, service_type, daycare_format,
      start_date, end_date, status,
      pets(name, type, breed),
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
      <CalendarView bookings={(bookings as any[]) ?? []} />
    </div>
  );
}
