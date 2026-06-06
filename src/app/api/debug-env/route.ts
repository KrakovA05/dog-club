import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function refFromUrl(url?: string) {
  if (!url) return null;
  const m = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
  return m ? m[1] : url;
}

function jwtRef(key?: string) {
  if (!key) return null;
  try {
    const payload = JSON.parse(Buffer.from(key.split(".")[1], "base64").toString());
    return { ref: payload.ref, role: payload.role };
  } catch {
    return "не JWT / не декодируется";
  }
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return NextResponse.json({
    url_ref: refFromUrl(url),
    service_role: jwtRef(serviceKey),
    anon: jwtRef(anonKey),
    resend: process.env.RESEND_API_KEY ? "SET" : "NOT SET",
  });
}
