import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { BookingForm } from "@/components/booking/BookingForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Pet } from "@/types";
import { UrgencyBanner } from "@/components/booking/UrgencyBanner";
import { BOOKING_OPEN } from "@/lib/booking-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Забронировать место в зоогостинице или детском саду",
  description:
    "Онлайн-бронирование места в детском саду или гостинице для собаки и кошки в Калуге. Быстро и удобно — укажите дату и питомца.",
  keywords: ["забронировать зоогостиницу Калуга", "записать собаку в детский сад Калуга", "онлайн запись передержка Калуга"],
  alternates: { canonical: "https://lapaclub.ru/booking" },
  openGraph: {
    title: "Забронировать место в зоогостинице или детском саду — Лапа Клуб Калуга",
    description: "Онлайн-бронирование места в детском саду или гостинице для вашего питомца в Калуге.",
    url: "https://lapaclub.ru/booking",
  },
};

export default async function BookingPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  if (!BOOKING_OPEN) {
    return (
      <section className="py-20 md:py-32">
        <div className="container mx-auto max-w-md px-4 text-center">
          <div className="text-6xl mb-6">🐾</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Мы готовимся к открытию!</h1>
          <p className="text-muted-foreground text-lg mb-3">
            Совсем скоро здесь можно будет забронировать место
            в детском саду или гостинице для вашего питомца.
          </p>
          <p className="text-muted-foreground mb-8">
            Онлайн-бронирование пока закрыто — следите за новостями
            или позвоните нам, если есть вопросы.
          </p>
          <div className="flex gap-3 justify-center">
            <Button render={<Link href="/contacts">Контакты</Link>} />
            <Button variant="outline" render={<Link href="/">На главную</Link>} />
          </div>
        </div>
      </section>
    );
  }

  const { type } = await searchParams;
  const petTypeFilter: "dog" | "cat" | undefined =
    type === "cats" ? "cat" : type === "dogs" ? "dog" : undefined;
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
            Регистрация займёт минуту — и сразу вернётесь к бронированию.
            Так вы сможете отслеживать статус и историю визитов в кабинете.
          </p>
          <div className="flex gap-3 justify-center">
            <Button render={<Link href="/register?redirect=/booking">Зарегистрироваться</Link>} />
            <Button variant="outline" render={<Link href="/login?redirect=/booking">Войти</Link>} />
          </div>
        </div>
      </section>
    );
  }

  const [{ data: pets }, { data: prices }] = await Promise.all([
    supabase
      .from("pets")
      .select("id, name, type, breed, weight_kg, special_needs, owner_id, birth_year, created_at, passport_photo_url")
      .eq("owner_id", user.id)
      .order("created_at"),
    supabase
      .from("prices")
      .select("service_type, label, price, unit, sort_order")
      .order("sort_order"),
  ]);

  const allPrices = prices ?? [];
  const daycareprices = allPrices.filter((p) => p.service_type === "daycare");
  // Все строки гостиницы — суточная цена выбирается по виду питомца в форме
  const hotelPrices = allPrices.filter((p) => p.service_type === "hotel");

  return (
    <>
      <section className="bg-brand-light py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Забронировать место
          </h1>
          <p className="text-muted-foreground text-lg mb-4">
            Выберите услугу и дату — свободные места и цена видны сразу
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
              ["Как подтверждается бронь?", "Статус появится в личном кабинете, мы также напишем на почту."],
              ["Что взять с собой?", "Корм питомца. Ветпаспорт — по желанию, можно прикрепить заранее в кабинете."],
              ["Как отменить бронирование?", "В личном кабинете в разделе «Мои бронирования» или позвоните нам."],
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
          <BookingForm
            pets={(pets as Pet[]) ?? []}
            daycareprices={daycareprices}
            hotelPrices={hotelPrices}
            petTypeFilter={petTypeFilter}
            defaultService={petTypeFilter ? "hotel" : undefined}
          />
        </div>
      </section>
    </>
  );
}
