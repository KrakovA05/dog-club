import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabase/client";
import { sendTelegramNotification } from "@/lib/telegram";

const DAYCRE_LABELS: Record<string, string> = {
  hour: "1 час",
  half_day: "полдня",
  full_day: "полный день",
};

function petIcon(type: string) {
  return type === "cat" ? "🐱" : "🐶";
}

function nightsLabel(start: string, end: string | null): string {
  if (!end) return "";
  const nights = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 86400000
  );
  return `${nights} ${nights === 1 ? "ночь" : nights < 5 ? "ночи" : "ночей"}`;
}

function shortDate(d: string): string {
  const [, m, day] = d.split("-");
  const months = ["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"];
  return `${parseInt(day)} ${months[parseInt(m) - 1]}`;
}

function bookingLine(b: {
  service_type: string;
  daycare_format: string | null;
  start_date: string;
  end_date: string | null;
  status?: string;
  pets: { name: string; type: string } | null;
}, showStatus = false): string {
  const pet = b.pets as { name: string; type: string } | null;
  const icon = petIcon(pet?.type ?? "dog");
  const name = pet?.name ?? "?";

  let detail = "";
  if (b.service_type === "daycare") {
    const tariff = DAYCRE_LABELS[b.daycare_format ?? ""] ?? b.daycare_format ?? "—";
    detail = `Садик, ${tariff}`;
  } else {
    const nights = nightsLabel(b.start_date, b.end_date);
    const range = b.end_date ? `${shortDate(b.start_date)}–${shortDate(b.end_date)}` : shortDate(b.start_date);
    detail = `Гостиница, ${nights} (${range})`;
  }

  const statusMark = showStatus
    ? b.status === "confirmed" ? " ✅" : " ⏳ ожидает"
    : "";

  return `  ${icon} ${name} — ${detail}${statusMark}`;
}

export async function GET(req: Request) {
  const secret = req.headers.get("x-report-secret");
  if (secret !== process.env.REPORT_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "No service key" }, { status: 500 });

  const supabase = createClient(SUPABASE_URL, serviceKey);

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const [todayBookings, tomorrowArrivals, newClients] = await Promise.all([
    // Новые брони созданные сегодня (кроме отменённых)
    supabase
      .from("bookings")
      .select("id, service_type, daycare_format, start_date, end_date, status, pets(name, type)")
      .gte("created_at", todayStr + "T00:00:00")
      .lt("created_at", todayStr + "T23:59:59")
      .neq("status", "cancelled")
      .order("created_at", { ascending: true }),

    // Заезды завтра (start_date = завтра, статус confirmed)
    supabase
      .from("bookings")
      .select("id, service_type, daycare_format, start_date, end_date, pets(name, type)")
      .eq("start_date", tomorrowStr)
      .eq("status", "confirmed"),

    // Новые клиенты за сегодня
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStr + "T00:00:00")
      .lt("created_at", todayStr + "T23:59:59"),
  ]);

  type PetRef = { name: string; type: string } | null;
  type BookingRow = {
    id: string;
    service_type: string;
    daycare_format: string | null;
    start_date: string;
    end_date: string | null;
    status: string;
    pets: PetRef;
  };
  type ArrivalRow = Omit<BookingRow, "status">;

  const bookings = (todayBookings.data ?? []) as unknown as BookingRow[];
  const arrivals = (tomorrowArrivals.data ?? []) as unknown as ArrivalRow[];

  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const newClientsCount = newClients.count ?? 0;

  const displayDate = shortDate(todayStr) + " " + today.getFullYear();

  const lines: string[] = [
    `🐾 <b>Лапа Клуб — итоги ${displayDate}</b>`,
    "",
  ];

  if (bookings.length === 0) {
    lines.push("📋 Новых броней сегодня: 0");
  } else {
    lines.push(`📋 <b>Новых броней сегодня: ${bookings.length}</b>`);
    lines.push("");
    bookings.forEach((b) => lines.push(bookingLine(b, true)));
    lines.push("");
    lines.push(`✅ Подтверждено: ${confirmed} из ${bookings.length}`);
  }

  if (newClientsCount > 0) {
    lines.push(`👥 Новых клиентов: ${newClientsCount}`);
  }

  lines.push("");

  if (arrivals.length === 0) {
    lines.push("📅 Завтра заезжают: нет");
  } else {
    lines.push(`📅 <b>Завтра заезжают: ${arrivals.length}</b>`);
    lines.push("");
    arrivals.forEach((b) => lines.push(bookingLine(b, false)));
  }

  await sendTelegramNotification(lines.join("\n"));

  return NextResponse.json({ ok: true, date: todayStr });
}
