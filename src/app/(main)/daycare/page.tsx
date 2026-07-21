import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { PhotoPromise } from "@/components/sections/PhotoPromise";
import { AppointmentNotice } from "@/components/sections/AppointmentNotice";
import { createClient } from "@/lib/supabase/server";
import { Clock, Check, AlertCircle, Heart, Users, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Детский сад для собак в Калуге",
  description: "Дневной уход за собаками в Калуге. Развивающие игры, прогулки, базовое воспитание. Ул. Дарвина 14.",
  keywords: ["детский сад для собак Калуга", "дневной уход за собакой Калуга", "передержка собак на день Калуга"],
  alternates: { canonical: "https://lapaclub.ru/daycare" },
  openGraph: {
    title: "Детский сад для собак в Калуге",
    description: "Час, полдня или полный день. Развивающие игры, прогулки, базовое воспитание.",
    url: "https://lapaclub.ru/daycare",
  },
};

// Описания форматов статичные, цены — из БД (фолбэк — текущие значения)
const FORMAT_META = [
  {
    label: "Час",
    fallback: 700,
    description: "Разовое посещение до 60 минут. Идеально, если нужно ненадолго отлучиться.",
    features: ["Развивающие игры, общение", "Наблюдение персонала"],
    isPopular: false,
  },
  {
    label: "Полдня",
    fallback: 1000,
    description: "~5 часов. Полноценный день с играми, прогулкой и отдыхом.",
    features: ["Развивающие игры, общение", "Базовое воспитание", "Прогулка", "Наблюдение персонала"],
    isPopular: true,
  },
  {
    label: "Полный день",
    fallback: 1200,
    description: "~11 часов. Полноценный день под присмотром — заберёте уставшего и довольного.",
    features: ["Развивающие игры, общение", "Базовое воспитание", "2 прогулки", "Наблюдение персонала", "Фото по запросу"],
    isPopular: false,
  },
];

async function getFormats() {
  const priceByLabel = new Map<string, number>();
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("prices")
      .select("label, price")
      .eq("service_type", "daycare");
    for (const p of data ?? []) priceByLabel.set(p.label.toLowerCase(), p.price);
  } catch {
    // фолбэк-значения ниже
  }
  return FORMAT_META.map((f) => ({
    duration: f.label,
    price: `${(priceByLabel.get(f.label.toLowerCase()) ?? f.fallback).toLocaleString("ru-RU")} ₽`,
    description: f.description,
    features: f.features,
    isPopular: f.isPopular,
  }));
}

const whyReasons = [
  {
    icon: Heart,
    title: "Социализация",
    desc: "Питомцам необходимо общаться и взаимодействовать с другими животными — это делает их спокойнее и увереннее.",
  },
  {
    icon: Users,
    title: "Развитие и обучение",
    desc: "Развивающие игры и занятия с зоонянями помогают питомцу осваивать новые навыки и справляться с непослушанием.",
  },
  {
    icon: Shield,
    title: "Питомец под присмотром",
    desc: "Пока вы на работе или в поездке — питомец не один. Профессиональный уход вместо одиночества дома.",
  },
];

const requirements = [
  "Только собаки весом до 15 кг (детский сад — без кошек)",
  "Без агрессии к людям и другим животным",
  "Актуальные прививки",
  "Возраст от 3 месяцев",
  "Здоровый питомец (без признаков болезни)",
];

export default async function DaycarePage() {
  const formats = await getFormats();
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
              мы обеспечим развивающие игры, общение и заботу.
            </p>
            <Button size="lg" render={<Link href="/booking">Занять место сейчас</Link>} />
          </div>
        </div>
      </section>

      <AppointmentNotice />

      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold mb-10 text-center">Выберите формат</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {formats.map((f) => (
              <Card
                key={f.duration}
                className="relative border-0 shadow-sm"
              >
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

      {/* Почему собакам необходим детский сад */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Почему питомцам необходим детский сад</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Это не просто передержка — это развитие и счастливая жизнь вашего питомца
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {whyReasons.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-background rounded-2xl p-6 shadow-sm flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-background">
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

            <div className="mt-6 flex gap-3 rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">
                <strong>Важно.</strong> Мы не принимаем агрессивных собак и собак с агрессией
                к сородичам — это безопасность всех питомцев в группе.
              </p>
            </div>
          </div>
        </div>
      </section>

      <PhotoPromise />
      <CtaBanner />
    </>
  );
}
