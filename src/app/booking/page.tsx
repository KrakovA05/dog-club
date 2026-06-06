import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { BookingForm } from "@/components/booking/BookingForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Pet } from "@/types";
import { UrgencyBanner } from "@/components/booking/UrgencyBanner";

export const metadata: Metadata = {
  title: "Забронировать место — Лапа Клуб",
  description:
    "Онлайн-бронирование места в детском саду или гостинице для вашего питомца.",
};

export default async function BookingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <section className="py-20 md:py-32">
        <div className="container mx-auto max-w-md px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">Забронировать место</h1>
          <p className="text-muted-foreground mb-8">
            Для бронирования нужен личный кабинет
          </p>
          <div className="flex gap-3 justify-center">
            <Button render={<Link href="/register">Зарегистрироваться</Link>} />
            <Button variant="outline" render={<Link href="/login?redirect=/booking">Войти</Link>} />
          </div>
        </div>
      </section>
    );
  }

  const [{ data: pets }, { data: prices }] = await Promise.all([
    supabase
      .from("pets")
      .select("id, name, type, breed, weight_kg, special_needs, owner_id, birth_year, created_at")
      .eq("owner_id", user.id)
      .order("created_at"),
    supabase
      .from("prices")
      .select("service_type, label, price, unit")
      .eq("service_type", "daycare")
      .order("sort_order"),
  ]);

  return (
    <>
      <section className="bg-brand-light py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Забронировать место
          </h1>
          <p className="text-muted-foreground text-lg mb-4">
            Заполните форму — ответим в течение нескольких часов
          </p>
          <UrgencyBanner />
        </div>
      </section>

      {/* FAQ перед формой */}
      <section className="pt-10 pb-0">
        <div className="container mx-auto max-w-xl px-4">
          <div className="rounded-xl bg-muted/40 p-5 space-y-3 text-sm mb-2">
            <p className="font-semibold text-base">Частые вопросы</p>
            {[
              ["Когда с нами свяжутся?", "В течение 1–2 часов в рабочее время (8:00–20:00)."],
              ["Что взять с собой?", "Ветпаспорт питомца с актуальными прививками и его корм."],
              ["Как отменить бронирование?", "Через личный кабинет или позвоните нам по телефону."],
            ].map(([q, a]) => (
              <div key={q}>
                <p className="font-medium">{q}</p>
                <p className="text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="container mx-auto max-w-xl px-4">
          <BookingForm pets={(pets as Pet[]) ?? []} daycareprices={prices ?? []} />
        </div>
      </section>
    </>
  );
}
