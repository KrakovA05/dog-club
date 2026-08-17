import { Camera, Heart, Clock } from "lucide-react";

const perks = [
  {
    icon: Camera,
    title: "Фото и видео каждый день",
    desc: "Ежедневный фото- и видеоотчёт о вашем питомце — убедитесь сами, что всё хорошо.",
  },
  {
    icon: Heart,
    title: "Индивидуальный уход",
    desc: "Знаем привычки и характер каждого питомца. Свободное размещение — никаких клеток и вольеров.",
  },
  {
    icon: Clock,
    title: "С 9:00 до 20:00",
    desc: "Заберите в любое удобное время. Работаем ежедневно без выходных.",
  },
];

export function PhotoPromise() {
  return (
    <section className="py-16 md:py-20 bg-brand-light">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Отдыхайте спокойно — будем на связи
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Мы понимаем, как тяжело оставлять питомца. Поэтому держим вас в курсе.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {perks.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-background rounded-2xl p-6 shadow-sm flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
