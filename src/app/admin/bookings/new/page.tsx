import { createAdminClient as createClient } from "@/lib/supabase/admin";
import { AdminBookingForm, type Profile, type Pet, type DaycarePrice, type PastGuest } from "./AdminBookingForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function AdminNewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; date?: string }>;
}) {
  const { client: preselectedClient, date: presetDate } = await searchParams;
  const supabase = createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .eq("is_admin", false)
    .eq("is_staff", false)
    .order("full_name");

  const [{ data: pets }, { data: prices }, { data: guestRows }] = await Promise.all([
    supabase
      .from("pets")
      .select("id, owner_id, name, type, breed, weight_kg, special_needs, passport_photo_url")
      .order("name"),
    supabase
      .from("prices")
      .select("service_type, label, price")
      .order("sort_order"),
    // Прошлые гостевые брони — для автоподстановки повторного гостя
    supabase
      .from("bookings")
      .select("guest_name, guest_phone, guest_pet_name, guest_pet_type, guest_pet_breed, guest_pet_weight, created_at")
      .not("guest_name", "is", null)
      .order("created_at", { ascending: false })
      .limit(300),
  ]);

  // Дедупликация гостей по телефону+кличке (берём самую свежую запись)
  const seen = new Set<string>();
  const pastGuests = (guestRows ?? []).filter((g) => {
    const key = `${g.guest_phone ?? ""}|${g.guest_name ?? ""}|${g.guest_pet_name ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 100);

  const allPrices = prices ?? [];
  const daycareprices = allPrices.filter((p) => p.service_type === "daycare");
  // Все строки гостиницы — суточная цена выбирается по виду питомца в форме
  const hotelPrices = allPrices.filter((p) => p.service_type === "hotel");

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
        profiles={(profiles ?? []) as unknown as Profile[]}
        allPets={(pets ?? []) as unknown as Pet[]}
        daycareprices={daycareprices as unknown as DaycarePrice[]}
        hotelPrices={hotelPrices}
        preselectedClientId={preselectedClient}
        presetDate={presetDate}
        pastGuests={(pastGuests ?? []) as unknown as PastGuest[]}
      />
    </div>
  );
}
