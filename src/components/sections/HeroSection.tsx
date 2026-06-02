import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export async function HeroSection() {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating")
    .eq("is_published", true);

  const count = reviews?.length ?? 0;
  const avg = count > 0
    ? (reviews!.reduce((s, r) => s + r.rating, 0) / count).toFixed(1)
    : "5.0";

  return (
    <section className="relative overflow-hidden bg-brand-light py-20 md:py-32">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex items-center gap-12">
          {/* Текст */}
          <div className="flex-1">
            <Badge variant="secondary" className="mb-6 text-sm">
              <MapPin className="h-3 w-3 mr-1" />
              Калуга, ул. Дарвина 14Ф
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Уходите спокойно —{" "}
              <span className="text-primary">питомец под присмотром</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              Зоогостиница и детский сад для собак и кошек в Калуге.
              Открытые боксы, видеонаблюдение, забота с 8:00 до 20:00.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="text-base px-8"
                render={<Link href="/booking">Забронировать место</Link>}
              />
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8"
                render={<Link href="/prices">Посмотреть цены</Link>}
              />
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-10 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <span className="font-semibold text-foreground">{avg}</span>
                {count > 0 && <span>· {count} {count === 1 ? "отзыв" : count < 5 ? "отзыва" : "отзывов"}</span>}
              </div>
              <div className="flex items-center gap-1.5">
                <span>🐾</span>
                <span>Собаки и кошки до 15 кг</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>✓</span>
                <span>Ветпаспорт обязателен</span>
              </div>
            </div>
          </div>

          {/* Логотип */}
          <div className="hidden md:flex shrink-0 items-center justify-center">
            <Image
              src="/logo.png"
              alt="Дог Клуб"
              width={320}
              height={320}
              className="object-contain drop-shadow-xl"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
