import Link from "next/link";
import {
  LayoutDashboard,
  CalendarCheck,
  DollarSign,
  HelpCircle,
  Star,
  Image,
  BookOpen,
  Users,
  Calendar,
  ExternalLink,
} from "lucide-react";

const nav = [
  {
    group: null,
    items: [
      { href: "/admin",          label: "Дашборд",   icon: LayoutDashboard },
      { href: "/admin/calendar", label: "Календарь", icon: Calendar },
    ],
  },
  {
    group: "Детский сад",
    items: [
      { href: "/admin/daycare/bookings", label: "Заявки", icon: CalendarCheck },
      { href: "/admin/daycare/prices",   label: "Цены",   icon: DollarSign },
    ],
  },
  {
    group: "Гостиница",
    items: [
      { href: "/admin/hotel/bookings", label: "Заявки", icon: CalendarCheck },
      { href: "/admin/hotel/prices",   label: "Цены",   icon: DollarSign },
    ],
  },
  {
    group: "Клиенты",
    items: [
      { href: "/admin/clients", label: "Все клиенты", icon: Users },
    ],
  },
  {
    group: "Контент",
    items: [
      { href: "/admin/faq",     label: "FAQ",     icon: HelpCircle },
      { href: "/admin/reviews", label: "Отзывы",  icon: Star },
      { href: "/admin/gallery", label: "Галерея", icon: Image },
      { href: "/admin/blog",    label: "Блог",    icon: BookOpen },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-52 bg-foreground text-background flex flex-col shrink-0">
        <div className="p-4 border-b border-background/10">
          <div className="font-bold text-sm">Лапа Клуб</div>
          <div className="text-xs text-background/40 mt-0.5">Панель управления</div>
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
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-background/40 hover:text-background/70 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            На сайт
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-8 bg-muted/30 overflow-auto">
        {children}
      </main>
    </div>
  );
}
