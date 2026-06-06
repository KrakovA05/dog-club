import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Email подтверждён — Лапа Клуб",
};

export default function ConfirmedPage() {
  return (
    <section className="min-h-[60vh] flex items-center justify-center py-20">
      <div className="text-center max-w-sm px-4">
        <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" />
        <h1 className="text-2xl font-bold mb-3">Регистрация прошла успешно!</h1>
        <p className="text-muted-foreground mb-8">
          Email подтверждён. Теперь вы можете войти в личный кабинет.
        </p>
        <Button render={<Link href="/login">Войти в кабинет</Link>} className="w-full" size="lg" />
      </div>
    </section>
  );
}
