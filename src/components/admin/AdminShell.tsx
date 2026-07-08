"use client";
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
  SlidersHorizontal,
  Ticket,
} from "lucide-react";
import { DashboardShell, type NavSection } from "./DashboardShell";

const nav: NavSection[] = [
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
      { href: "/admin/daycare/bookings", label: "Заявки",     icon: CalendarCheck },
      { href: "/admin/subscriptions",    label: "Абонементы", icon: Ticket },
      { href: "/admin/daycare/prices",   label: "Цены",       icon: DollarSign },
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
  {
    group: "Настройки",
    items: [
      { href: "/admin/settings", label: "Вместимость", icon: SlidersHorizontal },
    ],
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell subtitle="Панель управления" nav={nav}>
      {children}
    </DashboardShell>
  );
}
