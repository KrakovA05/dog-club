import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL")!;

interface BookingPayload {
  type: "INSERT";
  record: {
    id: string;
    user_id: string;
    pet_id: string;
    service_type: "daycare" | "hotel";
    daycare_format: string | null;
    start_date: string;
    end_date: string | null;
    notes: string | null;
    status: string;
    created_at: string;
  };
}

const SERVICE_LABELS: Record<string, string> = {
  daycare: "Детский сад",
  hotel: "Гостиница",
};

const FORMAT_LABELS: Record<string, string> = {
  hour: "Час",
  half_day: "Полдня",
  full_day: "Полный день",
};

serve(async (req) => {
  const payload: BookingPayload = await req.json();
  const b = payload.record;

  const serviceLabel = SERVICE_LABELS[b.service_type] ?? b.service_type;
  const formatLabel = b.daycare_format ? FORMAT_LABELS[b.daycare_format] : "";
  const dateLabel = b.end_date
    ? `${b.start_date} — ${b.end_date}`
    : b.start_date;

  const html = `
    <h2>Новая заявка на бронирование #${b.id.slice(0, 8)}</h2>
    <table style="border-collapse:collapse;width:100%;font-family:sans-serif;">
      <tr><td style="padding:8px;color:#666;">Услуга</td><td style="padding:8px;font-weight:bold;">${serviceLabel}${formatLabel ? ` — ${formatLabel}` : ""}</td></tr>
      <tr><td style="padding:8px;color:#666;">Дата</td><td style="padding:8px;">${dateLabel}</td></tr>
      ${b.notes ? `<tr><td style="padding:8px;color:#666;">Комментарий</td><td style="padding:8px;">${b.notes}</td></tr>` : ""}
      <tr><td style="padding:8px;color:#666;">Статус</td><td style="padding:8px;color:#e57c00;">Ожидает подтверждения</td></tr>
      <tr><td style="padding:8px;color:#666;">ID заявки</td><td style="padding:8px;font-size:12px;color:#999;">${b.id}</td></tr>
    </table>
    <p style="margin-top:16px;">
      <a href="https://supabase.com/dashboard/project/zmvoaanwikhztpvdjpty/editor" style="background:#2D8653;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
        Открыть в Supabase
      </a>
    </p>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Дог Клуб <noreply@dogclub-kaluga.ru>",
      to: [ADMIN_EMAIL],
      subject: `Новая заявка — ${serviceLabel} — ${b.start_date}`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ error: err }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});
