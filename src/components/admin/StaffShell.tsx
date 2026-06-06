"use client";
import { Calendar } from "lucide-react";
import { DashboardShell, type NavSection } from "./DashboardShell";

const nav: NavSection[] = [
  {
    group: null,
    items: [
      { href: "/staff/calendar", label: "Календарь", icon: Calendar },
    ],
  },
];

export function StaffShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell subtitle="Панель сотрудника" nav={nav}>
      {children}
    </DashboardShell>
  );
}
