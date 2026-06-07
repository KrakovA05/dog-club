import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, Moon, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

const services = [
  {
    icon: Clock,
    title: "Детский сад",
    description:
      "Оставьте питомца на час, полдня или полный день. Развивающие игры, общение — всё под присмотром.",
    features: ["Час от 400 ₽", "Полдня от 1 200 ₽", "Полный день от 1 800 ₽"],
    href: "/daycare",
    color: "text-primary",
    bg: "bg-brand-light",
  },
  {
    icon: Moon,
    title: "Гостиница",
    description:
      "Длительное проживание в комфортных зонах отдыха. Прогулки, забота — как дома.",
    features: ["От 1 500 ₽ в сутки", "Прогулки включены", "Воспитание по запросу"],
    href: "/hotel",
    color: "text-primary",
    bg: "bg-accent",
  },
];

export function ServicesPreview() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Наши услуги</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Найдите подходящий формат — от короткого визита до длительного проживания
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {services.map((service, i) => {
            const Icon = service.icon;
            return (
              <Reveal key={service.href} delay={i * 120} className="h-full">
              <Link href={service.href} className="group block h-full">
                <Card className="border-0 shadow-sm group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-200 h-full">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-xl ${service.bg} flex items-center justify-center mb-4`}>
                      <Icon className={`h-6 w-6 ${service.color}`} />
                    </div>
                    <CardTitle className="text-2xl">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{service.description}</p>
                    <ul className="space-y-2">
                      {service.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <span className="flex items-center gap-2 text-sm font-medium text-primary">
                      Подробнее
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </span>
                  </CardFooter>
                </Card>
              </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
