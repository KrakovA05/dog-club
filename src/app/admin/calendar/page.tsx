import { createClient } from "@/lib/supabase/server";
import { CalendarView } from "./CalendarView";

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
      <h1 className="text-2xl font-bold">Календарь записей</h1>
      <CalendarView bookings={(bookings as any[]) ?? []} />
    </div>
  );
}
