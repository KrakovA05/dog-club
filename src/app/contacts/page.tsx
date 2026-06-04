import type { Metadata } from "next";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/contacts/ContactForm";

export const metadata: Metadata = {
  title: "Контакты — Дог Клуб Калуга",
  description: "Адрес: Калуга, ул. Дарвина 14Ф. Телефон: +7 (4842) 00-00-00. Ежедневно 8:00–20:00. Зоогостиница и детский сад для животных.",
  alternates: { canonical: "https://dogclub-kaluga.ru/contacts" },
};

const contacts = [
  { icon: MapPin, label: "Адрес", value: "Калуга, ул. Дарвина 14Ф", href: null },
  { icon: Phone, label: "Телефон", value: "+7 (4842) 00-00-00", href: "tel:+74842000000" },
  { icon: Mail, label: "Email", value: "info@dogclub-kaluga.ru", href: "mailto:info@dogclub-kaluga.ru" },
  { icon: Clock, label: "Режим работы", value: "Ежедневно 8:00 – 20:00", href: null },
];

export default function ContactsPage() {
  return (
    <>
      <section className="bg-brand-light py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Контакты</h1>
          <p className="text-muted-foreground text-lg">Мы в центре Калуги — легко добраться</p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Левая колонка */}
            <div className="space-y-4">
              {contacts.map(({ icon: Icon, label, value, href }) => (
                <Card key={label} className="border-0 shadow-sm">
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="w-10 h-10 rounded-lg bg-brand-light flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
                      {href ? (
                        <a href={href} className="font-medium hover:text-primary transition-colors">
                          {value}
                        </a>
                      ) : (
                        <div className="font-medium">{value}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button size="lg" className="w-full mt-4" render={<a href="tel:+74842000000">Позвонить сейчас</a>} />

              <div className="pt-4">
                <ContactForm />
              </div>
            </div>

            {/* Карта */}
            <div className="rounded-2xl overflow-hidden shadow-sm border" style={{ minHeight: "400px" }}>
              <iframe
                src="https://yandex.ru/map-widget/v1/?text=%D0%9A%D0%B0%D0%BB%D1%83%D0%B3%D0%B0%2C+%D1%83%D0%BB.+%D0%94%D0%B0%D1%80%D0%B2%D0%B8%D0%BD%D0%B0+14%D0%A4&z=16"
                width="100%"
                height="100%"
                style={{ border: "none", minHeight: "400px" }}
                allowFullScreen
                title="Дог Клуб на карте"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
