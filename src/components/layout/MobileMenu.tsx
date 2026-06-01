"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { href: "/daycare", label: "Детский сад" },
  { href: "/hotel", label: "Гостиница" },
  { href: "/prices", label: "Цены" },
  { href: "/gallery", label: "Галерея" },
  { href: "/about", label: "О нас" },
  { href: "/faq", label: "FAQ" },
  { href: "/contacts", label: "Контакты" },
];

export function MobileMenu({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);

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
              render={<Link href="/booking" onClick={() => setOpen(false)} />}
              className="w-full"
              size="lg"
            >
              Забронировать
            </Button>
            {isLoggedIn ? (
              <Button
                variant="outline"
                render={<Link href="/cabinet" onClick={() => setOpen(false)} />}
                className="w-full"
              >
                Личный кабинет
              </Button>
            ) : (
              <Button
                variant="outline"
                render={<Link href="/login" onClick={() => setOpen(false)} />}
                className="w-full"
              >
                Войти
              </Button>
            )}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
