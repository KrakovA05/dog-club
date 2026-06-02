import { createAdminClient as createClient } from "@/lib/supabase/admin";
import { AdminBookingForm } from "./AdminBookingForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function AdminNewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client: preselectedClient } = await searchParams;
  const supabase = createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .eq("is_admin", false)
    .eq("is_staff", false)
    .order("full_name");

  const [{ data: pets }, { data: prices }] = await Promise.all([
    supabase
      .from("pets")
      .select("id, owner_id, name, type, breed, weight_kg, special_needs, passport_photo_url")
      .order("name"),
    supabase
      .from("prices")
      .select("label, price")
      .eq("service_type", "daycare")
      .order("sort_order"),
  ]);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/daycare/bookings" className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Записать клиента</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Создание заявки от имени администратора</p>
        </div>
      </div>

      <AdminBookingForm
        profiles={(profiles as any[]) ?? []}
        allPets={(pets as any[]) ?? []}
        daycareprices={(prices as any[]) ?? []}
        preselectedClientId={preselectedClient}
      />
    </div>
  );
}
