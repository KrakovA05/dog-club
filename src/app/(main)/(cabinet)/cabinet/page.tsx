import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/cabinet/ProfileForm";
import { DeleteAccountSection } from "@/components/cabinet/DeleteAccountSection";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Профиль — Личный кабинет" };

export default async function CabinetPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Профиль</h1>
        <p className="text-muted-foreground text-sm mt-1">Ваши личные данные</p>
      </div>

      <div className="rounded-xl border p-6 space-y-1.5 text-sm">
        <div className="text-muted-foreground">Email</div>
        <div className="font-medium">{user.email}</div>
        <div className="text-muted-foreground pt-2">Аккаунт создан</div>
        <div className="font-medium">
          {new Date(user.created_at).toLocaleDateString("ru-RU")}
        </div>
      </div>

      <div className="rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold">Редактировать данные</h2>
        <ProfileForm
          profile={profile ?? {
            id: user.id,
            full_name: null,
            phone: null,
            email: user.email ?? null,
            is_admin: false,
            is_staff: false,
            created_at: user.created_at,
          }}
        />
      </div>

      <DeleteAccountSection />
    </div>
  );
}
