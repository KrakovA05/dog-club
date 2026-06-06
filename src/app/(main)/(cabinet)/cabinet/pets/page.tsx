import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PetsClient } from "./PetsClient";
import type { Pet } from "@/types";

export const metadata: Metadata = { title: "Мои питомцы" };

export default async function PetsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pets } = await supabase
    .from("pets")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at");

  return <PetsClient initialPets={(pets as Pet[]) ?? []} />;
}
