import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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
      <div className="rounded-xl border p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground mb-1">Имя</div>
            <div className="font-medium">{profile?.full_name ?? "Не указано"}</div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">Email</div>
            <div className="font-medium">{user.email}</div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">Телефон</div>
            <div className="font-medium">{profile?.phone ?? "Не указан"}</div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">Аккаунт создан</div>
            <div className="font-medium">
              {new Date(user.created_at).toLocaleDateString("ru-RU")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
