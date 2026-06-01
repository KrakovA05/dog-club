import { createAdminClient as createClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { PawPrint, ChevronRight } from "lucide-react";

export default async function AdminClientsPage() {
  const supabase = createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, phone, created_at")
    .eq("is_admin", false)
    .order("created_at", { ascending: false });

  const { data: pets } = await supabase
    .from("pets")
    .select("id, owner_id, name, type");

  const petsByOwner = (pets ?? []).reduce<Record<string, typeof pets>>((acc, pet) => {
    if (!pet) return acc;
    if (!acc[pet.owner_id]) acc[pet.owner_id] = [];
    acc[pet.owner_id]!.push(pet);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Клиенты</h1>
        <p className="text-muted-foreground text-sm mt-1">{profiles?.length ?? 0} пользователей</p>
      </div>

      {!profiles?.length ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          Клиентов пока нет
        </div>
      ) : (
        <div className="space-y-2">
          {profiles.map((p) => {
            const ownerPets = petsByOwner[p.id] ?? [];
            return (
              <Link
                key={p.id}
                href={`/admin/clients/${p.id}`}
                className="flex items-center justify-between bg-background rounded-xl border px-5 py-4 hover:shadow-sm transition-shadow"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="font-medium">{p.full_name ?? "—"}</div>
                  <div className="text-sm text-muted-foreground">
                    {p.phone ?? "Телефон не указан"}
                    {" · "}
                    {new Date(p.created_at).toLocaleDateString("ru-RU")}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {ownerPets.length > 0 && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <PawPrint className="h-4 w-4" />
                      {ownerPets.length}
                    </div>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
