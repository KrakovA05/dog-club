"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Баннер cookie (152-ФЗ + рекомендации РКН по информированию о cookie).
// На сайте только технически необходимые cookie: сессия Supabase Auth (sb-*)
// и сам маркер выбора (cookie-consent). Аналитики/рекламы/профилирования нет.
// Пользователю даётся реальный выбор «Принять» / «Отклонить». Решение храним
// в обычной cookie год, чтобы не переспрашивать и чтобы можно было честно
// подтвердить факт волеизъявления.
const CONSENT_COOKIE = "cookie-consent"; // значения: "accepted" | "rejected"

function setConsent(value: "accepted" | "rejected") {
  document.cookie = `${CONSENT_COOKIE}=${value}; max-age=31536000; path=/; samesite=lax`;
}

export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  // Проверяем cookie только на клиенте после mount — иначе hydration mismatch.
  // setTimeout: не вызываем setState синхронно в эффекте (react-hooks) и даём
  // странице отрисоваться до появления плашки.
  useEffect(() => {
    const decided = document.cookie
      .split("; ")
      .some((c) => c.startsWith(`${CONSENT_COOKIE}=`));
    if (decided) return;
    const t = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  function accept() {
    setConsent("accepted");
    setVisible(false);
  }

  function reject() {
    // Отклонение фиксируем; необязательных cookie на сайте нет, поэтому
    // ничего дополнительно устанавливать/удалять не требуется. Технически
    // необходимая сессия появляется только при явном входе в личный кабинет.
    setConsent("rejected");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 pointer-events-none">
      <div className="pointer-events-auto container mx-auto max-w-3xl bg-card border rounded-2xl shadow-lg px-4 py-3 sm:px-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="text-xs sm:text-sm text-muted-foreground leading-snug flex-1">
          Мы используем только технически необходимые файлы cookie — они нужны
          для входа в личный кабинет. Аналитических и рекламных cookie, а также
          профилирования на сайте нет. Подробнее — в{" "}
          <Link href="/privacy#cookie" className="text-primary underline underline-offset-2">
            политике в отношении cookie
          </Link>
          .
        </p>
        <div className="flex gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={reject}
            className="flex-1 sm:flex-none"
          >
            Отклонить
          </Button>
          <Button
            size="sm"
            onClick={accept}
            className="flex-1 sm:flex-none"
          >
            Принять
          </Button>
        </div>
      </div>
    </div>
  );
}
