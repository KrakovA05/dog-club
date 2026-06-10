"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/daycare", label: "Детский сад" },
  { href: "/prices", label: "Цены" },
  { href: "/gallery", label: "Галерея" },
  { href: "/about", label: "О нас" },
  { href: "/faq", label: "FAQ" },
  { href: "/contacts", label: "Контакты" },
];

export function MobileMenu({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [hotelOpen, setHotelOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        }
      />
      <SheetContent side="right" className="w-72">
        <nav className="flex flex-col gap-1 mt-8">
          {/* Гостиница — с аккордеоном */}
          <div>
            <button
              type="button"
              onClick={() => setHotelOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-base font-medium hover:bg-accent transition-colors"
            >
              Гостиница
              <ChevronDown className={cn("h-4 w-4 transition-transform", hotelOpen && "rotate-180")} />
            </button>
            {hotelOpen && (
              <div className="flex flex-col gap-0.5 pl-4">
                <Link
                  href="/hotel?type=dogs"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
                >
                  Собаки
                </Link>
                <Link
                  href="/hotel?type=cats"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
                >
                  Кошки
                </Link>
              </div>
            )}
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="px-4 py-3 rounded-lg text-base font-medium hover:bg-accent transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t mt-4 pt-4 flex flex-col gap-2">
            <Button
              render={<Link href="/booking" onClick={() => setOpen(false)}>Забронировать</Link>}
              className="w-full"
              size="lg"
            />
            {isLoggedIn ? (
              <Button
                variant="outline"
                render={<Link href="/cabinet" onClick={() => setOpen(false)}>Личный кабинет</Link>}
                className="w-full"
              />
            ) : (
              <Button
                variant="outline"
                render={<Link href="/login" onClick={() => setOpen(false)}>Войти</Link>}
                className="w-full"
              />
            )}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
