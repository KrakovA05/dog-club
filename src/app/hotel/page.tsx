import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { Check, Moon, Package } from "lucide-react";

export const metadata: Metadata = {
  title: "Зоогостиница для собак и кошек в Калуге",
  description: "Длительное проживание питомцев в Калуге. Открытые боксы, прогулки, кормление. Собаки и кошки до 15 кг. От 1500 ₽ в сутки.",
};

const included = [
  "Размещение в открытом боксе",
  "Кормление вашим кормом (привезите с собой)",
  "Прогулки каждый день",
  "Фото и видео по запросу",
  "Общение и игры с персоналом",
];

const extras = [
  { name: "Дрессировка", description: "Базовые команды, коррекция поведения — по запросу хозяина", price: "от 800 ₽/занятие" },
  { name: "Такси для питомца", description: "Заберём из дома и привезём обратно", price: "уточняйте" },
];

export default function HotelPage() {
  return (
    <>
      <section className="bg-accent py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-4">Гостиница</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Гостиница для питомцев</h1>
            <p className="text-lg text-muted-foreground mb-4">
              Уезжаете в командировку или отпуск? Ваш питомец проживёт в открытом боксе
              под постоянным присмотром. Минимальный срок — одни сутки.
            </p>
            <div className="text-3xl font-bold text-primary mb-8">от 1 500 ₽/сутки</div>
            <Button size="lg" render={<Link href="/booking">Забронировать место</Link>} />
          </div>
        </div>
      </section>

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

      <CtaBanner />
    </>
  );
}
