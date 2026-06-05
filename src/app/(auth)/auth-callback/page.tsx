"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let done = false;

    async function handle() {
      // Парсим hash вручную — некоторые браузеры (in-app) не дают Supabase
      // обработать его автоматически
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!error && !done) {
          done = true;
          router.replace(type === "recovery" ? "/reset-password" : "/cabinet");
          return;
        }
      }

      // Fallback: PKCE code в query-параметрах
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && !done) {
          done = true;
          router.replace("/reset-password");
          return;
        }
      }
    }

    handle();

    // На случай если Supabase всё же обработает hash сам
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (done) return;
      if (event === "PASSWORD_RECOVERY") {
        done = true;
        router.replace("/reset-password");
      }
    });

    const timer = setTimeout(() => {
      if (!done) setExpired(true);
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [router]);

  if (expired) {
    return (
      <div className="bg-card rounded-2xl shadow-sm p-8 text-center space-y-4">
        <p className="text-sm text-muted-foreground">Ссылка недействительна или истекла.</p>
        <Link href="/forgot-password" className="text-primary text-sm font-medium hover:underline block">
          Запросить новую ссылку
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-sm p-8 text-center">
      <p className="text-muted-foreground text-sm">Проверяем ссылку…</p>
    </div>
  );
}
