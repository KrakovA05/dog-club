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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (done) return;
      if (event === "PASSWORD_RECOVERY") {
        done = true;
        router.replace("/reset-password");
      }
      // SIGNED_IN fires before PASSWORD_RECOVERY for recovery sessions — don't handle it here
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
