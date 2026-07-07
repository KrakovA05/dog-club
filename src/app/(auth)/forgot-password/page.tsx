import Link from "next/link";
import type { Metadata } from "next";
import { KeyRound, Phone } from "lucide-react";

export const metadata: Metadata = { title: "Восстановление пароля" };

// Автоматический сброс пароля по email отключён вместе с Resend (152-ФЗ:
// email клиентов не передаётся за рубеж). Восстановление — вручную через
// администратора. Вернём самообслуживание после подключения российского SMTP
// (см. заготовку в src/lib/email.ts).
export default function ForgotPasswordPage() {
  return (
    <div className="bg-card rounded-2xl shadow-sm p-8 text-center">
      <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <KeyRound className="h-6 w-6 text-primary" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Восстановление пароля</h1>
      <p className="text-muted-foreground text-sm leading-relaxed mb-6">
        Автоматический сброс пароля по email временно недоступен.
        Позвоните или напишите нам — подтвердим личность и восстановим
        доступ вручную за пару минут.
      </p>

      <a
        href="tel:+79605185000"
        className="inline-flex items-center justify-center gap-2 w-full rounded-lg bg-primary text-primary-foreground text-sm font-medium py-2.5 hover:opacity-90 transition-opacity"
      >
        <Phone className="h-4 w-4" />
        +7 (960) 518-50-00
      </a>
      <p className="text-muted-foreground text-xs mt-3">
        Ежедневно 9:00–20:00 · или через{" "}
        <Link href="/contacts" className="text-primary underline underline-offset-2">
          форму на странице контактов
        </Link>
      </p>

      <p className="text-center text-sm text-muted-foreground mt-6">
        <Link href="/login" className="text-primary font-medium hover:underline">
          Вернуться ко входу
        </Link>
      </p>
    </div>
  );
}
