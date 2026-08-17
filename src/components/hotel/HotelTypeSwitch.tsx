"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Dog, Cat } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "dogs" as const, label: "Собаки", sub: "мелкие породы · от 1 600 ₽/сут", Icon: Dog },
  { value: "cats" as const, label: "Кошки",  sub: "без огр. по весу · от 1 200 ₽/сут", Icon: Cat },
];

export function HotelTypeSwitch({ currentType }: { currentType: "dogs" | "cats" | null }) {
  const router = useRouter();
  const [selected, setSelected] = useState<"dogs" | "cats">(currentType ?? "dogs");

  function select(value: "dogs" | "cats") {
    if (value === selected) return;
    setSelected(value);
    router.push(`/hotel?type=${value}`);
  }

  return (
    <div className="hidden md:inline-flex bg-black/5 rounded-2xl p-1.5 gap-1 mb-8">
      {OPTIONS.map(({ value, label, sub, Icon }) => {
        const active = selected === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => select(value)}
            className={cn(
              "relative flex items-center gap-3 px-6 py-3.5 rounded-xl transition-all duration-200 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-primary",
              active
                ? "bg-white shadow-md text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-white/60"
            )}
          >
            <Icon
              className={cn(
                "h-6 w-6 shrink-0 transition-colors duration-200",
                active ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span className="text-left">
              <span className="block font-semibold text-base leading-tight">{label}</span>
              <span className="block text-xs text-muted-foreground leading-tight mt-0.5">{sub}</span>
            </span>
            {active && (
              <span className="absolute inset-x-0 -bottom-0.5 mx-auto h-0.5 w-8 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
