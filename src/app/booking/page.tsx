import type { Metadata } from "next";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Забронировать место — Дог Клуб",
  description: "Забронируйте место для вашего питомца в Дог Клуб. Позвоните нам или оставьте заявку онлайн.",
};

export default function BookingPage() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto max-w-sm px-4 text-center">
        <h1 className="text-4xl font-bold mb-4">Забронировать место</h1>
        <p className="text-muted-foreground text-lg mb-10">
          Онлайн-бронирование появится совсем скоро. Пока — позвоните нам.
        </p>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4">
            <Phone className="h-10 w-10 text-primary" />
            <div>
              <div className="font-semibold mb-1">Позвонить</div>
              <a href="tel:+74842000000" className="text-primary text-lg font-medium">
                +7 (4842) 00-00-00
              </a>
            </div>
            <Button size="lg" className="w-full" render={<a href="tel:+74842000000">Позвонить</a>} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
