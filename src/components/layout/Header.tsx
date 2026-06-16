import Link from "next/link";
import Image from "next/image";
import { MobileMenu } from "./MobileMenu";
import { Phone, User, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const navLinks = [
  { href: "/daycare", label: "Детский сад" },
  { href: "/hotel", label: "Гостиница" },
  { href: "/prices", label: "Цены" },
  { href: "/gallery", label: "Галерея" },
  { href: "/blog", label: "Блог" },
];
// Подпункты раздела «О нас»
const aboutLinks = [
  { href: "/about", label: "О клубе" },
  { href: "/faq", label: "Вопросы и ответы" },
];

export async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo-icon-3.png"
              alt="Лапа Клуб"
              width={36}
              height={36}
              className="rounded-lg object-contain"
            />
            <span className="font-bold text-xl text-brand-dark">Лапа Клуб</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                {link.label}
              </Link>
            ))}

            {/* «О нас» с выпадающим подменю (FAQ внутри) — на чистом CSS */}
            <div className="relative group">
              <Link
                href="/about"
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                О нас
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
              </Link>
              <div className="absolute left-0 top-full pt-1 hidden group-hover:block group-focus-within:block">
                <div className="min-w-48 rounded-xl border bg-background shadow-lg p-1">
                  {aboutLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="block px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link
              href="/contacts"
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            >
              Контакты
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="tel:+79605185000"
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Phone className="h-4 w-4" />
              +7 (960) 518-50-00
            </a>
            <Link
              href="/booking"
              className="hidden md:flex items-center justify-center h-7 rounded-[min(var(--radius-md),12px)] bg-primary px-2.5 text-[0.8rem] font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
            >
              Забронировать
            </Link>
            {user ? (
              <Link
                href="/cabinet"
                className="hidden md:flex items-center gap-1.5 h-7 rounded-[min(var(--radius-md),12px)] border border-border px-2.5 text-[0.8rem] font-medium text-foreground hover:bg-accent transition-colors"
              >
                <User className="h-3.5 w-3.5" />
                Кабинет
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden md:flex items-center h-7 rounded-[min(var(--radius-md),12px)] border border-border px-2.5 text-[0.8rem] font-medium text-foreground hover:bg-accent transition-colors"
              >
                Войти
              </Link>
            )}
            <MobileMenu isLoggedIn={!!user} />
          </div>
        </div>
      </div>
    </header>
  );
}
