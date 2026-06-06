import type { Metadata } from "next";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "О нас — Лапа Клуб Калуга",
  description: "Команда профессионалов, которые любят животных. Зоогостиница и детский сад в Калуге.",
};

export default function AboutPage() {
  return (
    <>
      <section className="bg-brand-light py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <Badge className="mb-4">О нас</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Мы любим животных</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Лапа Клуб — это команда профессионалов в Калуге, которые создали место,
              где каждому питомцу рады. Мы принимаем собак и кошек до 15 кг
              на дневное пребывание и длительное проживание.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold mb-4">Наш подход</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Мы понимаем, что для вас питомец — это член семьи. Поэтому
                  стараемся создать атмосферу, максимально приближённую к домашней.
                  Уютные зоны отдыха, живое общение, прогулки — никаких клеток и изоляции.
                </p>
                <p>
                  Каждый питомец получает индивидуальное внимание. Мы изучаем
                  привычки и предпочтения вашего животного, чтобы пребывание было комфортным.
                </p>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">Наши принципы</h2>
              <ul className="space-y-3 text-muted-foreground">
                {[
                  "Безопасность прежде всего — проверяем прививки и здоровье",
                  "Уважение к питомцу и хозяину",
                  "Профессиональный подход к каждому случаю",
                ].map((p) => (
                  <li key={p} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
