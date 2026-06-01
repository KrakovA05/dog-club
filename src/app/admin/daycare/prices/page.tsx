import { createClient } from "@/lib/supabase/server";
import { PricesAdmin } from "@/components/admin/PricesAdmin";
import type { PriceRow } from "@/types";

export default async function DaycarePricesPage() {
  const supabase = await createClient();
  const { data: prices } = await supabase
    .from("prices")
    .select("*")
    .eq("service_type", "daycare")
    .order("sort_order");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Детский сад — Цены</h1>
        <p className="text-muted-foreground text-sm mt-1">Изменения сразу применяются на странице /prices</p>
      </div>
      <PricesAdmin prices={(prices as PriceRow[]) ?? []} serviceType="daycare" />
    </div>
  );
}
