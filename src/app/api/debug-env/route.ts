import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? `SET (${process.env.SUPABASE_SERVICE_ROLE_KEY.length} chars)` : "NOT SET",
    RESEND_API_KEY: process.env.RESEND_API_KEY ? `SET (${process.env.RESEND_API_KEY.length} chars)` : "NOT SET",
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "NOT SET",
    NODE_ENV: process.env.NODE_ENV,
  });
}
