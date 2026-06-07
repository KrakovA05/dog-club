import { AlertTriangle } from "lucide-react";

/** Заметная плашка: не принимаем агрессивных животных. */
export function SafetyNotice() {
  return (
    <section className="bg-destructive/10 border-y border-destructive/30">
      <div className="container mx-auto max-w-4xl px-4 py-4 flex items-center justify-center gap-3 text-center">
        <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-destructive shrink-0" />
        <p className="text-sm md:text-base font-semibold text-destructive">
          Мы не принимаем агрессивных животных и животных с агрессией к сородичам — ради безопасности всех питомцев.
        </p>
      </div>
    </section>
  );
}
