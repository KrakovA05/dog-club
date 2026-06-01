"use client";
import { cancelBooking } from "@/lib/cabinet-actions";
import { useTransition } from "react";

export function CancelBookingButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Отменить заявку? Это действие нельзя отменить.")) return;
    startTransition(() => cancelBooking(id));
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-xs text-muted-foreground hover:text-destructive disabled:opacity-50 transition-colors underline underline-offset-2"
    >
      {isPending ? "Отменяем..." : "Отменить заявку"}
    </button>
  );
}
