import { Shield, Heart, MapPin, Users } from "lucide-react";

const reasons = [
  {
    icon: Shield,
    title: "Безопасность",
    description:
      "Открытые боксы, видеонаблюдение, требуем ветпаспорт с актуальными прививками.",
  },
  {
    icon: Heart,
    title: "Внимание и забота",
    description:
      "Каждый питомец получает индивидуальное внимание. Фото и видео по запросу.",
  },
  {
    icon: MapPin,
    title: "Удобное расположение",
    description:
      "Центр Калуги, ул. Дарвина 14Ф. Легко добраться, есть парковка.",
  },
  {
    icon: Users,
    title: "Команда профессионалов",
    description:
      "Любим животных и знаем, как найти подход к любому характеру.",
  },
];

export function WhyUs() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Почему выбирают нас</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((reason) => {
            const Icon = reason.icon;
            return (
              <div key={reason.title} className="group flex flex-col items-center text-center p-6 rounded-2xl hover:bg-background hover:shadow-md transition-all duration-200">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 group-hover:bg-primary/15 flex items-center justify-center mb-4 transition-colors duration-200">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{reason.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {reason.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
