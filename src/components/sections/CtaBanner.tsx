import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

export function CtaBanner() {
  return (
    <section className="py-16 md:py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto max-w-6xl px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Готовы доверить нам своего питомца?
        </h2>
        <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
          Оставьте заявку онлайн или позвоните — ответим в течение нескольких часов
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            variant="secondary"
            className="text-base px-8"
            render={<Link href="/booking">Забронировать онлайн</Link>}
          />
          <Button
            size="lg"
            variant="outline"
            className="text-base px-8 border-primary-foreground/60 text-primary-foreground bg-transparent hover:bg-primary-foreground/15"
            render={
              <a href="tel:+74842000000" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Позвонить
              </a>
            }
          />
        </div>
      </div>
    </section>
  );
}
