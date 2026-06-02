import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const rawNext = searchParams.get("next") ?? "/cabinet";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/cabinet";

  const type = rawType === "email" || rawType === "recovery" ? rawType : null;

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      const redirectTo = type === "recovery" ? "/reset-password" : next;
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }

  return NextResponse.redirect(new URL("/login?error=invalid_link", request.url));
}
