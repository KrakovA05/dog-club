import type { Metadata } from "next";

export const revalidate = 3600;
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { CtaBanner } from "@/components/sections/CtaBanner";
import type { PriceRow } from "@/types";

export const metadata: Metadata = {
  title: "Цены на зоогостиницу и детский сад для животных в Калуге",
  description: "Цены на передержку собак и кошек в Калуге: детский сад 500 ₽/час, гостиница 1 200 ₽/сутки. Актуальный прайс-лист Лапа Клуб.",
  keywords: ["цены зоогостиница Калуга", "стоимость передержки собак Калуга", "прайс детский сад для собак", "сколько стоит передержка кошки Калуга"],
  alternates: { canonical: "https://lapaclub.ru/prices" },
  openGraph: {
    title: "Цены на зоогостиницу и детский сад для животных в Калуге",
    description: "Цены на передержку собак и кошек в Калуге: детский сад 500 ₽/час, гостиница 1 200 ₽/сутки.",
    url: "https://lapaclub.ru/prices",
  },
};

export const dynamic = "force-dynamic";

async function getPrices(): Promise<{ daycare: PriceRow[]; hotel: PriceRow[] }> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("prices").select("*").order("sort_order");
    const all = (data as PriceRow[] | null) ?? [];
    return {
      daycare: all.filter((p) => p.service_type === "daycare"),
      hotel: all.filter((p) => p.service_type === "hotel"),
    };
  } catch (e) {
    console.error("Prices fetch error:", e);
    return { daycare: [], hotel: [] };
  }
}

function PriceTable({ prices }: { prices: PriceRow[] }) {
  return (
    <div className="rounded-2xl border overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-6 py-4 font-semibold">Услуга</th>
            <th className="text-left px-6 py-4 font-semibold hidden sm:table-cell">Описание</th>
            <th className="text-right px-6 py-4 font-semibold">Стоимость</th>
          </tr>
        </thead>
        <tbody>
          {prices.map((price) => (
            <tr key={price.id} className={`border-t ${price.is_featured ? "bg-primary/5" : ""}`}>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{price.label}</span>
                  {price.is_featured && <Badge className="text-xs">Популярный</Badge>}
                </div>
              </td>
              <td className="px-6 py-4 text-muted-foreground text-sm hidden sm:table-cell">
                {price.description}
              </td>
              <td className="px-6 py-4 text-right font-bold text-primary">
                {price.price.toLocaleString("ru-RU")} ₽
                <span className="text-xs font-normal text-muted-foreground ml-1">/{price.unit}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function buildPriceSchema(daycare: PriceRow[], hotel: PriceRow[]) {
  const toOffer = (p: PriceRow) => ({
    "@type": "Offer",
    name: p.label,
    description: p.description ?? undefined,
    price: p.price,
    priceCurrency: "RUB",
    availability: "https://schema.org/InStock",
    seller: { "@type": "LocalBusiness", name: "Лапа Клуб" },
  });

  return [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Детский сад для собак — Лапа Клуб",
      description: "Дневной уход за собаками в Калуге. Игры, прогулки, кормление вашим кормом.",
      url: "https://lapaclub.ru/daycare",
      provider: { "@type": "LocalBusiness", name: "Лапа Клуб", url: "https://lapaclub.ru" },
      areaServed: { "@type": "City", name: "Калуга" },
      offers: daycare.map(toOffer),
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Зоогостиница для собак и кошек — Лапа Клуб",
      description: "Длительная передержка собак до 15 кг и кошек в Калуге.",
      url: "https://lapaclub.ru/hotel",
      provider: { "@type": "LocalBusiness", name: "Лапа Клуб", url: "https://lapaclub.ru" },
      areaServed: { "@type": "City", name: "Калуга" },
      offers: hotel.map(toOffer),
    },
  ];
}

export default async function PricesPage() {
  const { daycare, hotel } = await getPrices();
  const priceSchema = buildPriceSchema(daycare, hotel);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(priceSchema) }}
      />
      <section className="bg-brand-light py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Цены</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Прозрачные цены без скрытых платежей. Кормление вашим кормом входит в стоимость.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="mb-14">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              Детский сад <Badge variant="outline">дневное пребывание</Badge>
            </h2>
            {daycare.length > 0 ? <PriceTable prices={daycare} /> : (
              <p className="text-muted-foreground text-center py-8">Цены появятся скоро</p>
            )}
          </div>

          <div className="mb-14">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              Гостиница <Badge variant="outline">длительное проживание</Badge>
            </h2>
            {hotel.length > 0 ? <PriceTable prices={hotel} /> : (
              <p className="text-muted-foreground text-center py-8">Цены появятся скоро</p>
            )}
          </div>

          <div className="text-center">
            <Button size="lg" render={<Link href="/booking">Забронировать</Link>} />
          </div>
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
