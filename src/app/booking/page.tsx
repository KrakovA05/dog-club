import type { Metadata } from "next";
import { Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Забронировать место — Дог Клуб",
  description: "Забронируйте место для вашего питомца в Дог Клуб. Онлайн-форма или WhatsApp.",
};

export default function BookingPage() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto max-w-xl px-4 text-center">
        <h1 className="text-4xl font-bold mb-4">Забронировать место</h1>
        <p className="text-muted-foreground text-lg mb-10">
          Онлайн-бронирование появится совсем скоро. Пока — свяжитесь с нами удобным способом.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6 pb-6 flex flex-col items-center gap-3">
              <Phone className="h-8 w-8 text-primary" />
              <div>
                <div className="font-semibold mb-1">Позвонить</div>
                <a href="tel:+74842000000" className="text-primary text-sm font-medium">
                  +7 (4842) 00-00-00
                </a>
              </div>
              <Button variant="outline" size="sm" className="w-full" render={<a href="tel:+74842000000">Позвонить</a>} />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6 pb-6 flex flex-col items-center gap-3">
              <MessageCircle className="h-8 w-8 text-green-600" />
              <div>
                <div className="font-semibold mb-1">WhatsApp</div>
                <span className="text-sm text-muted-foreground">Ответим быстро</span>
              </div>
              <Button variant="outline" size="sm" className="w-full" render={<a href="https://wa.me/74842000000" target="_blank" rel="noopener noreferrer">Написать</a>} />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
