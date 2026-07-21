import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { PhotoPromise } from "@/components/sections/PhotoPromise";
import { SafetyNotice } from "@/components/sections/SafetyNotice";
import { AppointmentNotice } from "@/components/sections/AppointmentNotice";
import { Check, Moon, Package } from "lucide-react";
import { HotelTypeSwitch } from "@/components/hotel/HotelTypeSwitch";

export const metadata: Metadata = {
  title: "Зоогостиница для собак и кошек в Калуге — 1 200 ₽/сутки",
  description: "Зоогостиница в Калуге для собак до 15 кг (1 600 ₽/сут) и кошек без ограничений по весу (1 200 ₽/сут). Открытые боксы, прогулки, ваш корм. Ул. Дарвина 14.",
  keywords: ["зоогостиница Калуга", "гостиница для собак Калуга", "передержка собак Калуга", "гостиница для кошек Калуга", "куда отдать собаку Калуга"],
  alternates: { canonical: "https://lapaclub.ru/hotel" },
  openGraph: {
    title: "Зоогостиница для собак и кошек в Калуге",
    description: "Открытые боксы, прогулки, кормление. 1 200 ₽ в сутки.",
    url: "https://lapaclub.ru/hotel",
  },
};

const included = [
  "Размещение в комфортной зоне отдыха",
  "Кормление вашим кормом (привезите с собой)",
  "Прогулки каждый день",
  "Фото и видео по запросу",
  "Общение и игры с персоналом",
];

const extras = [
  { name: "Дрессировка", description: "Базовые команды, коррекция поведения — по запросу хозяина", price: "800 ₽/занятие" },
  { name: "Такси для питомца", description: "Заберём из дома и привезём обратно", price: "уточняйте" },
];

export default async function HotelPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const isDogs = type === "dogs";
  const isCats = type === "cats";

  const heroTitle = isCats
    ? "Гостиница для кошек"
    : isDogs
    ? "Гостиница для собак"
    : "Гостиница для питомцев";

  const heroDesc = isCats
    ? "Уютные отдельные комнаты без ограничений по весу. Кошки отдыхают отдельно от собак — тишина и покой гарантированы."
    : isDogs
    ? "Просторные боксы с ежедневными прогулками для собак до 15 кг. Постоянный уход и игры с персоналом."
    : "Уезжаете в командировку или отпуск? Ваш питомец проведёт каникулы в комфортной зоне отдыха под постоянным присмотром.";

  const heroPrice = isCats ? "1 200 ₽/сутки" : isDogs ? "1 600 ₽/сутки" : "1 200 ₽/сутки";
  const bookingHref = isCats ? "/booking?type=cats" : isDogs ? "/booking?type=dogs" : "/booking";

  return (
    <>
      <section className="bg-accent py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-4">Гостиница</Badge>

            <HotelTypeSwitch currentType={isDogs ? "dogs" : isCats ? "cats" : null} />

            <h1 className="text-4xl md:text-5xl font-bold mb-6">{heroTitle}</h1>
            <p className="text-lg text-muted-foreground mb-4">{heroDesc}</p>
            <p className="text-sm text-muted-foreground mb-6">Минимальный срок — одни сутки.</p>
            <div className="text-3xl font-bold text-primary mb-8">{heroPrice}</div>
            <Button size="lg" render={<Link href={bookingHref}>Зарезервировать место</Link>} />
          </div>
        </div>
      </section>

      <AppointmentNotice />

      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Moon className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Что включено в стоимость</h2>
              </div>
              <ul className="space-y-3">
                {included.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-6">
                <Package className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Дополнительные услуги</h2>
              </div>
              <div className="space-y-4">
                {extras.map((extra) => (
                  <Card key={extra.name} className="border-0 shadow-sm">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold">{extra.name}</h3>
                        <span className="text-sm font-medium text-primary">{extra.price}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{extra.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                * Такси появится в ближайшее время. Уточняйте при бронировании.
              </p>
            </div>
          </div>
        </div>
      </section>

      <SafetyNotice />
      <PhotoPromise />
      <CtaBanner />
    </>
  );
}
