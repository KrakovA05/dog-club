"use client";
import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Menu, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; icon: LucideIcon };
export type NavSection = { group: string | null; items: NavItem[] };

export function DashboardShell({
  subtitle,
  nav,
  children,
}: {
  subtitle: string;
  nav: NavSection[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="min-h-screen md:flex">
      {/* Мобильная шапка */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-foreground text-background px-4 h-14">
        <div className="font-bold text-sm">Лапа Клуб</div>
        <button onClick={() => setOpen(true)} aria-label="Открыть меню" className="p-2 -mr-2">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Затемнение под дровером */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={close} />
      )}

      {/* Сайдбар: на мобиле дровер, на десктопе статичный */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-foreground text-background flex flex-col transition-transform duration-200",
          "md:static md:z-auto md:w-52 md:translate-x-0 md:shrink-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-background/10 flex items-center justify-between">
          <div>
            <div className="font-bold text-sm">Лапа Клуб</div>
            <div className="text-xs text-background/40 mt-0.5">{subtitle}</div>
          </div>
          <button onClick={close} aria-label="Закрыть меню" className="md:hidden p-2 -mr-2">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-2 overflow-y-auto">
          {nav.map((section, i) => (
            <div key={i} className={i > 0 ? "mt-4" : ""}>
              {section.group && (
                <div className="px-3 py-1.5 text-xs font-semibold text-background/40 uppercase tracking-wider">
                  {section.group}
                </div>
              )}
              {section.items.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={close}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-background/70 hover:text-background hover:bg-background/10 transition-colors"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-2 border-t border-background/10">
          <Link
            href="/"
            onClick={close}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-background/40 hover:text-background/70 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            На сайт
          </Link>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-4 md:p-8 bg-muted/30 overflow-auto">
        {children}
      </main>
    </div>
  );
}
