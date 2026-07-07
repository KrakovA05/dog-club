import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const rawNext = searchParams.get("next") ?? "/auth/confirmed";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/auth/confirmed";
  const type = rawType === "email" || rawType === "recovery" ? rawType : null;

  // За reverse-proxy (Amvera) request.url содержит localhost — используем продакшн-домен
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  const supabase = await createClient();

  // Страница /reset-password удалена вместе с email-recovery (152-ФЗ, 07.2026);
  // recovery-ссылки больше не рассылаются — на всякий случай ведём на заглушку.
  // PKCE flow (новые версии Supabase)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const redirectTo = type === "recovery" ? "/forgot-password" : next;
      return NextResponse.redirect(new URL(redirectTo, base));
    }
  }

  // OTP flow (старый формат)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      const redirectTo = type === "recovery" ? "/forgot-password" : next;
      return NextResponse.redirect(new URL(redirectTo, base));
    }
  }

  return NextResponse.redirect(new URL("/login?error=invalid_link", base));
}
