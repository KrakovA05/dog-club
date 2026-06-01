import { createAdminClient as createClient } from "@/lib/supabase/admin";
import { GalleryAdmin } from "@/components/admin/GalleryAdmin";
import type { GalleryItem } from "@/types";

export default async function AdminGalleryPage() {
  const supabase = createClient();
  const { data: items } = await supabase.from("gallery").select("*").order("sort_order");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Галерея</h1>
      <GalleryAdmin items={(items as GalleryItem[]) ?? []} />
    </div>
  );
}
