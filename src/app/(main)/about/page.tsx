import type { Metadata } from "next";

export const dynamic = "force-static";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "О зоогостинице Лапа Клуб — профессиональные зоо-няни",
  description: "Лапа Клуб — зоогостиница и детский сад для животных в Калуге. Принимаем собак мелких пород и кошек. Профессиональный уход, ул. Дарвина 14.",
  keywords: ["о нас лапа клуб", "зоогостиница Калуга команда", "передержка животных Калуга о нас"],
  alternates: { canonical: "https://lapaclub.ru/about" },
  openGraph: {
    title: "О зоогостинице Лапа Клуб — профессиональные зоо-няни",
    description: "Лапа Клуб — зоогостиница и детский сад для животных в Калуге. Профессиональный уход, ул. Дарвина 14.",
    url: "https://lapaclub.ru/about",
  },
};

export default function AboutPage() {
  return (
    <>
      <section className="bg-brand-light py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <Badge className="mb-4">О нас</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Профессиональные зоо-няни</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              В Лапа Клуб работают только профессиональные зоо-няни с опытом работы
              в зоосфере. Мы принимаем собак мелких пород и кошек без ограничений
              по весу на дневное пребывание и длительное проживание — свободное
              размещение без клеток и вольеров.
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
                  Свободное размещение без клеток и вольеров, уютные зоны отдыха, живое общение и прогулки.
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
                  "Только профессиональные зоо-няни с опытом работы в зоосфере",
                  "Свободное размещение без клеток и вольеров",
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
