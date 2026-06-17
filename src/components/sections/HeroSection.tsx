import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { getPublishedReviewRatings } from "@/lib/public-queries";

export async function HeroSection() {
  const reviews = await getPublishedReviewRatings();
  const count = reviews.length;

  return (
    <section className="relative overflow-hidden bg-brand-light py-16 md:py-32">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex items-center gap-12">
          {/* Текст */}
          <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-700 motion-reduce:animate-none">
            {/* Логотип на мобиле */}
            <div className="flex md:hidden justify-center mb-8">
              <Image
                src="/logo-2.png"
                alt="Лапа Клуб"
                width={120}
                height={120}
                className="object-contain drop-shadow-lg"
                priority
              />
            </div>

            <Badge variant="secondary" className="mb-6 text-sm">
              <MapPin className="h-3 w-3 mr-1" />
              Калуга, ул. Дарвина 14
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Отдыхайте спокойно —{" "}
              <span className="text-primary">питомец под присмотром</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              Зоогостиница и детский сад для собак и кошек в Калуге.
              Уютные зоны отдыха и забота профессиональных зоонянь.
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
                <span>🐾</span>
                <span>Собаки и кошки до 20 кг</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>✓</span>
                <span>Прививки обязательны</span>
              </div>
              {count > 0 && (
                <div className="flex items-center gap-1.5">
                  <span>★</span>
                  <span>{count} {count === 1 ? "отзыв" : count < 5 ? "отзыва" : "отзывов"} клиентов</span>
                </div>
              )}
            </div>
          </div>

          {/* Логотип на десктопе */}
          <div className="hidden md:flex shrink-0 items-center justify-center animate-in fade-in zoom-in-95 duration-1000 motion-reduce:animate-none">
            <Image
              src="/logo-2.png"
              alt="Лапа Клуб"
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
