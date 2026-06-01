import Link from "next/link";
import { Calendar, ExternalLink } from "lucide-react";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-52 bg-foreground text-background flex flex-col shrink-0">
        <div className="p-4 border-b border-background/10">
          <div className="font-bold text-sm">Дог Клуб</div>
          <div className="text-xs text-background/40 mt-0.5">Панель сотрудника</div>
        </div>

        <nav className="flex-1 p-2">
          <Link
            href="/staff/calendar"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-background/70 hover:text-background hover:bg-background/10 transition-colors"
          >
            <Calendar className="h-4 w-4 shrink-0" />
            Календарь
          </Link>
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
