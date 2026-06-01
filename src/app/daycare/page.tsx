import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { Clock, Check, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Детский сад для собак и кошек",
  description: "Дневной уход за питомцами в Калуге. Час, полдня или полный день — кормление, игры, прогулки. Принимаем собак и кошек до 15 кг.",
};

const formats = [
  {
    duration: "Час",
    price: "от 400 ₽",
    description: "Разовое посещение до 60 минут. Идеально если нужно ненадолго отлучиться.",
    features: ["Игры и общение", "Наблюдение персонала"],
    isPopular: false,
  },
  {
    duration: "Полдня",
    price: "от 1 200 ₽",
    description: "~5 часов. Кормление вашим кормом включено.",
    features: ["Кормление включено", "Игры и общение", "Прогулка"],
    isPopular: true,
  },
  {
    duration: "Полный день",
    price: "от 1 800 ₽",
    description: "~11 часов. Полноценный день под присмотром — заберёте уставшего и довольного.",
    features: ["Кормление включено", "2 прогулки", "Игры и общение", "Фото по запросу"],
    isPopular: false,
  },
];

const requirements = [
  "Собаки и кошки весом до 15 кг",
  "Актуальные прививки (ветпаспорт обязателен)",
  "Возраст от 3 месяцев",
  "Здоровый питомец (без признаков болезни)",
];

export default function DaycarePage() {
  return (
    <>
      <section className="bg-brand-light py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <Badge className="mb-4">Детский сад</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Дневной уход за вашим питомцем
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Оставьте питомца на час, полдня или полный день. Пока вы на работе или по делам —
              мы обеспечим общение, игры и заботу.
            </p>
            <Button size="lg" render={<Link href="/booking">Записаться</Link>} />
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold mb-10 text-center">Выберите формат</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {formats.map((f) => (
              <Card
                key={f.duration}
                className={`relative ${f.isPopular ? "border-primary shadow-md" : "border-0 shadow-sm"}`}
              >
                {f.isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Популярный</Badge>
                )}
                <CardContent className="pt-8 pb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-bold">{f.duration}</h3>
                  </div>
                  <div className="text-2xl font-bold text-primary mb-3">{f.price}</div>
                  <p className="text-muted-foreground text-sm mb-4">{f.description}</p>
                  <ul className="space-y-1.5">
                    {f.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <AlertCircle className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Требования к питомцам</h2>
            </div>
            <ul className="space-y-3">
              {requirements.map((req) => (
                <li key={req} className="flex items-start gap-3 text-sm">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
