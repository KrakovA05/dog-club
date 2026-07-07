"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Информационная плашка о cookie (152-ФЗ). НЕ consent-manager: трекеров на
// сайте нет, cookie только технически необходимые (sb-* сессия Supabase Auth).
// Факт ознакомления храним в обычной cookie (не localStorage), срок — год.
const CONSENT_COOKIE = "tech-consent";

export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  // Проверяем cookie только на клиенте после mount — иначе hydration mismatch.
  // setTimeout: не вызываем setState синхронно в эффекте (react-hooks) и даём
  // странице отрисоваться до появления плашки.
  useEffect(() => {
    const seen = document.cookie
      .split("; ")
      .some((c) => c.startsWith(`${CONSENT_COOKIE}=`));
    if (seen) return;
    const t = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  function accept() {
    document.cookie = `${CONSENT_COOKIE}=1; max-age=31536000; path=/; samesite=lax`;
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 pointer-events-none">
      <div className="pointer-events-auto container mx-auto max-w-3xl bg-card border rounded-2xl shadow-lg px-4 py-3 sm:px-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="text-xs sm:text-sm text-muted-foreground leading-snug flex-1">
          Сайт использует только технически необходимые файлы cookie (сессия
          авторизации). Продолжая пользоваться сайтом, вы соглашаетесь с{" "}
          <Link href="/privacy" className="text-primary underline underline-offset-2">
            политикой конфиденциальности
          </Link>
          .
        </p>
        <Button size="sm" onClick={accept} className="shrink-0 w-full sm:w-auto">
          Понятно
        </Button>
      </div>
    </div>
  );
}
