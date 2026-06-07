import { createAdminClient as createClient } from "@/lib/supabase/admin";
import { CapacitySettings } from "@/components/admin/CapacitySettings";
import type { CapacityZoneRow } from "@/types";

export const dynamic = "force-dynamic";

const ZONE_ORDER = ["dog_daycare", "dog_hotel", "cats"];

export default async function AdminSettingsPage() {
  const supabase = createClient();
  const { data } = await supabase.from("capacity_zones").select("*");
  const zones = ((data as CapacityZoneRow[] | null) ?? [])
    .slice()
    .sort((a, b) => ZONE_ORDER.indexOf(a.zone) - ZONE_ORDER.indexOf(b.zone));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Вместимость</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Сколько животных можно принять одновременно. Бронь нельзя подтвердить сверх лимита.
        </p>
      </div>

      {zones.length > 0 ? (
        <CapacitySettings zones={zones} />
      ) : (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          Зоны вместимости не настроены — примените миграцию 016_capacity.sql
        </div>
      )}
    </div>
  );
}
