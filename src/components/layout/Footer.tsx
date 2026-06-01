import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="bg-brand-dark text-brand-light">
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <Image src="/logo.png" alt="Дог Клуб" width={32} height={32} className="rounded-lg object-contain brightness-200" />
              <h3 className="font-bold text-lg">Дог Клуб</h3>
            </div>
            <p className="text-sm opacity-70">
              Зоогостиница и детский сад для собак и кошек в Калуге.
              Профессиональный уход, внимание и любовь к каждому питомцу.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-4">Услуги</h3>
            <nav className="flex flex-col gap-2">
              {[
                { href: "/daycare", label: "Детский сад" },
                { href: "/hotel", label: "Гостиница" },
                { href: "/prices", label: "Цены" },
                { href: "/booking", label: "Забронировать" },
                { href: "/faq", label: "Частые вопросы" },
                { href: "/blog", label: "Блог" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm opacity-70 hover:opacity-100 transition-opacity"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h3 className="font-bold mb-4">Контакты</h3>
            <div className="flex flex-col gap-3 text-sm opacity-70">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Калуга, ул. Дарвина 14Ф</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                <a href="tel:+74842000000" className="hover:opacity-100 transition-opacity">
                  +7 (4842) 00-00-00
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <a href="mailto:info@dogclub-kaluga.ru" className="hover:opacity-100 transition-opacity">
                  info@dogclub-kaluga.ru
                </a>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Ежедневно 8:00 – 20:00</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8 opacity-20" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm opacity-50">
          <p>© 2026 Дог Клуб. Все права защищены.</p>
          <Link href="/privacy" className="hover:opacity-70 transition-opacity">
            Политика конфиденциальности
          </Link>
        </div>
      </div>
    </footer>
  );
}
