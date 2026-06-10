// Транзакционные письма через Resend.
// Ошибки логируем, но никогда не роняем бронь — письмо вторично.

const FORMAT_LABELS: Record<string, string> = {
  hour: "Час",
  half_day: "Полдня",
  full_day: "Полный день",
};

function formatDateRu(d: string): string {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function sendBookingConfirmationEmail(params: {
  to: string;
  petName: string;
  serviceType: "daycare" | "hotel";
  daycareFormat: string | null;
  startDate: string;
  endDate: string | null;
}): Promise<void> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("[booking-email] RESEND_API_KEY не настроен — письмо не отправлено");
      return;
    }

    const isHotel = params.serviceType === "hotel";
    const serviceLabel = isHotel ? "Гостиница" : "Детский сад";

    const rows: [string, string][] = [
      ["Услуга", serviceLabel],
      ["Питомец", params.petName],
    ];
    if (isHotel && params.endDate) {
      rows.push(["Заезд", formatDateRu(params.startDate)]);
      rows.push(["Выезд", formatDateRu(params.endDate)]);
    } else {
      rows.push(["Дата посещения", formatDateRu(params.startDate)]);
      if (params.daycareFormat && FORMAT_LABELS[params.daycareFormat]) {
        rows.push(["Формат", FORMAT_LABELS[params.daycareFormat]]);
      }
    }

    const rowsHtml = rows
      .map(
        ([label, value]) => `
          <tr>
            <td style="padding:10px 16px;color:#999;font-size:14px;border-bottom:1px solid #f0e9dc;">${label}</td>
            <td style="padding:10px 16px;color:#1a1a1a;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #f0e9dc;">${value}</td>
          </tr>`
      )
      .join("");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Лапа Клуб <noreply@lapaclub.ru>",
        to: [params.to],
        subject: `Бронь подтверждена — ${serviceLabel}, ${formatDateRu(params.startDate)}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
            <h2 style="margin:0 0 8px;color:#1a1a1a;">Бронь подтверждена ✅</h2>
            <p style="color:#555;margin:0 0 24px;">
              Ждём вас и вашего питомца в Лапа Клубе!
            </p>

            <table style="width:100%;border-collapse:separate;border-spacing:0;background:#f9f5ee;border-radius:12px;overflow:hidden;" cellpadding="0" cellspacing="0">
              <tbody>
                <tr><td colspan="2" style="padding:8px;"></td></tr>
                ${rowsHtml}
                <tr><td colspan="2" style="padding:8px;"></td></tr>
              </tbody>
            </table>

            <div style="margin:24px 0;padding:16px;border:1px solid #eee;border-radius:12px;">
              <p style="margin:0 0 6px;color:#1a1a1a;font-size:14px;font-weight:600;">Как нас найти</p>
              <p style="margin:0;color:#555;font-size:14px;line-height:1.6;">
                Калуга, ул. Дарвина 14<br>
                Ежедневно 9:00 – 20:00
              </p>
            </div>

            <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 4px;">
              Не забудьте ветпаспорт питомца и корм.
            </p>
            <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 24px;">
              По всем вопросам: <a href="tel:+79605185000" style="color:#8B6914;">+7 (960) 518-50-00</a>
            </p>

            <p style="color:#999;font-size:13px;line-height:1.5;margin:0;">
              Управлять бронью можно в <a href="https://lapaclub.ru/cabinet/bookings" style="color:#8B6914;">личном кабинете</a>.
            </p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      console.error("[booking-email] Resend error:", res.status, await res.text());
    }
  } catch (e) {
    console.error("[booking-email] unexpected error:", e instanceof Error ? e.message : e);
  }
}
