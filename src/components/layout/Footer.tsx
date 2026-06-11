import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="bg-brand-dark text-brand-light">
      {/* Мини-CTA */}
      <div className="border-b border-white/10">
        <div className="container mx-auto max-w-6xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm opacity-80 text-center sm:text-left">
            Остались вопросы? Позвоните или оставьте заявку онлайн
          </p>
          <div className="flex gap-3 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="border-white/30 text-brand-light bg-transparent hover:bg-white/10 hover:text-brand-light"
              render={<a href="tel:+79605185000">Позвонить</a>}
            />
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/80"
              render={<Link href="/booking">Забронировать</Link>}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <Image src="/icon-3.png" alt="Лапа Клуб" width={32} height={32} className="rounded-lg object-contain brightness-200" />
              <p className="font-bold text-lg">Лапа Клуб</p>
            </div>
            <p className="text-sm opacity-70 leading-relaxed">
              Зоогостиница и детский сад для собак и кошек в Калуге.
              Профессиональный уход, внимание и любовь к каждому питомцу.
            </p>
          </div>

          <div>
            <p className="font-bold mb-4">Услуги</p>
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
                  className="text-sm opacity-70 hover:opacity-100 transition-opacity w-fit"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="font-bold mb-4">Контакты</p>
            <div className="flex flex-col gap-3 text-sm opacity-70">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Калуга, ул. Дарвина 14</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                <a href="tel:+79605185000" className="hover:opacity-100 transition-opacity">
                  +7 (960) 518-50-00
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <a href="mailto:info@lapaclub.ru" className="hover:opacity-100 transition-opacity">
                  info@lapaclub.ru
                </a>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Ежедневно 9:00 – 20:00</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.523-2.049-1.713-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.408 4 7.932c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.474-.085.716-.576.716z"/>
                </svg>
                <a href="https://vk.ru/lapaclub40" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">
                  ВКонтакте
                </a>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8 opacity-20" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm opacity-50">
          <p>© 2026 Лапа Клуб. Все права защищены.</p>
          <Link href="/privacy" className="hover:opacity-70 transition-opacity">
            Политика конфиденциальности
          </Link>
        </div>
      </div>
    </footer>
  );
}
