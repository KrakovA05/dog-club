import type { Metadata } from "next";

export const dynamic = "force-static";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/contacts/ContactForm";

export const metadata: Metadata = {
  title: "Контакты",
  description: "Адрес: Калуга, ул. Дарвина 14. Телефон: +7 (960) 518-50-00. Ежедневно 9:00–20:00. Зоогостиница и детский сад для животных.",
  alternates: { canonical: "https://lapaclub.ru/contacts" },
  openGraph: {
    title: "Контакты — Лапа Клуб Калуга",
    description: "Калуга, ул. Дарвина 14. Телефон: +7 (960) 518-50-00. Ежедневно 9:00–20:00.",
    url: "/contacts",
  },
};

const contacts = [
  { icon: MapPin, label: "Адрес", value: "Калуга, ул. Дарвина 14", href: null },
  { icon: Phone, label: "Телефон", value: "+7 (960) 518-50-00", href: "tel:+79605185000" },
  { icon: Mail, label: "Email", value: "info@lapaclub.ru", href: "mailto:info@lapaclub.ru" },
  { icon: Clock, label: "Режим работы", value: "Ежедневно 9:00 – 20:00", href: null },
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
              <Button size="lg" className="w-full mt-4" render={<a href="tel:+79605185000">Позвонить сейчас</a>} />

              <Link
                href="https://vk.ru/lapaclub40"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-accent transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[#0077FF] flex items-center justify-center shrink-0">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.523-2.049-1.713-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.408 4 7.932c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.474-.085.716-.576.716z"/>
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Мы ВКонтакте</div>
                  <div className="font-medium">vk.ru/lapaclub40</div>
                </div>
              </Link>

              <div className="pt-4">
                <ContactForm />
              </div>
            </div>

            {/* Карта */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold">Мы на карте</h2>
              <div className="rounded-2xl overflow-hidden shadow-sm border" style={{ minHeight: "400px" }}>
                <iframe
                  src="https://yandex.ru/map-widget/v1/?text=Калуга, улица Дарвина, 14&z=17"
                  width="100%"
                  height="100%"
                  style={{ border: "none", minHeight: "400px" }}
                  allowFullScreen
                  title="Лапа Клуб на карте — Калуга, ул. Дарвина 14"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
