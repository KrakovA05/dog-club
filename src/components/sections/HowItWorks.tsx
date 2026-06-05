import { ClipboardList, PawPrint, Smile } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    step: "1",
    title: "Оставьте заявку",
    desc: "Заполните форму онлайн — ответим в течение часа и подберём удобное время.",
  },
  {
    icon: PawPrint,
    step: "2",
    title: "Приведите питомца",
    desc: "Приходите в назначенное время с ветпаспортом и кормом. Мы познакомимся и всё оформим.",
  },
  {
    icon: Smile,
    step: "3",
    title: "Заберите довольного",
    desc: "В конце дня вас ждёт уставший и счастливый питомец. По запросу пришлём фото в течение дня.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Как это работает</h2>
          <p className="text-muted-foreground text-lg">Всё просто — три шага до комфорта питомца и вашего спокойствия</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Линия между шагами (только десктоп) */}
          <div className="hidden md:block absolute top-10 left-[calc(16.6%+1rem)] right-[calc(16.6%+1rem)] h-px bg-border" />

          {steps.map(({ icon: Icon, step, title, desc }) => (
            <div key={step} className="flex flex-col items-center text-center relative">
              <div className="relative mb-5">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {step}
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
