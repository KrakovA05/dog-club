import { createAdminClient as createClient } from "@/lib/supabase/admin";
import { SubscriptionsAdmin } from "@/components/admin/SubscriptionsAdmin";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  const supabase = createClient();

  const [{ data: subs }, { data: clients }, { data: pets }, { data: staff }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("*, subscription_visits(*), profiles(full_name, phone), pets(name, type)")
      .order("purchased_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, phone")
      .eq("is_admin", false)
      .eq("is_staff", false)
      .order("full_name"),
    supabase.from("pets").select("id, owner_id, name, type").order("name"),
    // Для колонки «кто отметил» в журнале
    supabase.from("profiles").select("id, full_name").or("is_admin.eq.true,is_staff.eq.true"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Абонементы</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Детский сад: 6 посещений (60 дней) и 12 посещений (90 дней), полный день
        </p>
      </div>

      <SubscriptionsAdmin
        subscriptions={(subs ?? []) as never}
        clients={(clients ?? []) as never}
        pets={(pets ?? []) as never}
        staff={(staff ?? []) as never}
      />
    </div>
  );
}
