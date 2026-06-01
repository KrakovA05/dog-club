import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { User, PawPrint, Calendar, LogOut, Home } from "lucide-react";

const navItems = [
  { href: "/cabinet", label: "Профиль", icon: User },
  { href: "/cabinet/pets", label: "Мои питомцы", icon: PawPrint },
  { href: "/cabinet/bookings", label: "Бронирования", icon: Calendar },
];

export default async function CabinetLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="grid md:grid-cols-[220px_1fr] gap-8">
        <aside className="space-y-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-3">
            Личный кабинет
          </div>
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          <div className="border-t pt-2 mt-4 space-y-1">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Home className="h-4 w-4" />
              На сайт
            </Link>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
              >
                <LogOut className="h-4 w-4" />
                Выйти
              </button>
            </form>
          </div>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
