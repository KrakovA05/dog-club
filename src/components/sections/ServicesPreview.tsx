import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, Moon, ArrowRight } from "lucide-react";

const services = [
  {
    icon: Clock,
    title: "Детский сад",
    description:
      "Оставьте питомца на час, полдня или полный день. Игры, общение, кормление вашим кормом — всё под присмотром.",
    features: ["Час от 400 ₽", "Полдня от 1 200 ₽", "Полный день от 1 800 ₽"],
    href: "/daycare",
    color: "text-primary",
    bg: "bg-brand-light",
  },
  {
    icon: Moon,
    title: "Гостиница",
    description:
      "Длительное проживание в открытых боксах. Прогулки, кормление, забота — как дома, только без вас.",
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
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Card
                key={service.href}
                className="border-0 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-xl ${service.bg} flex items-center justify-center mb-4`}
                  >
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
                  <Button
                    variant="outline"
                    className="w-full"
                    render={
                      <Link href={service.href} className="flex items-center gap-2">
                        Подробнее <ArrowRight className="h-4 w-4" />
                      </Link>
                    }
                  />
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
