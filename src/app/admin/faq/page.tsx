import { createClient } from "@/lib/supabase/server";
import { FaqAdmin } from "@/components/admin/FaqAdmin";
import type { FaqRow } from "@/types";

export default async function AdminFaqPage() {
  const supabase = await createClient();
  const { data: faqs } = await supabase.from("faq").select("*").order("sort_order");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">FAQ</h1>
        <p className="text-muted-foreground text-sm mt-1">Изменения сразу применяются на странице /faq</p>
      </div>
      <FaqAdmin faqs={(faqs as FaqRow[]) ?? []} />
    </div>
  );
}
