import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-brand-light py-20 md:py-32">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="max-w-2xl">
          <Badge variant="secondary" className="mb-6 text-sm">
            <MapPin className="h-3 w-3 mr-1" />
            Калуга, ул. Дарвина 14Ф
          </Badge>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Ваш питомец{" "}
            <span className="text-primary">в надёжных руках</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
            Зоогостиница и детский сад для собак и кошек. Принимаем питомцев
            на час, полдня, полный день — или на всё время вашего отсутствия.
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

          <div className="flex items-center gap-6 mt-10 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="font-medium text-foreground">5.0</span>
              <span>— отзывы клиентов</span>
            </div>
            <div>Собаки и кошки до 15 кг</div>
          </div>
        </div>
      </div>
      <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
    </section>
  );
}
