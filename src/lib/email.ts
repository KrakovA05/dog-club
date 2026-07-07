// ─────────────────────────────────────────────────────────────────────────
// Email-уведомления ОТКЛЮЧЕНЫ (07.2026, 152-ФЗ).
//
// Resend Inc. (США) удалён полностью — email клиентов больше не передаётся
// за пределы РФ (ст. 12 152-ФЗ, трансграничная передача). Текущие каналы:
//   - клиент видит бронь в личном кабинете (/cabinet/bookings);
//   - админ получает Telegram-уведомление (без ПДн клиентов).
//
// Ниже — НЕ ПОДКЛЮЧЁННАЯ заготовка под будущий российский SMTP
// (Яндекс 360 / Mail.ru / VK WorkMail). Для включения понадобится:
//   1) npm i nodemailer (+ @types/nodemailer)
//   2) env в панели Amvera: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
//   3) раскомментировать, вернуть вызовы в booking-actions / admin-actions
//   4) обновить /privacy (новое третье лицо — SMTP-провайдер)
// ─────────────────────────────────────────────────────────────────────────

// import nodemailer from "nodemailer";
//
// export async function sendBookingConfirmationEmail(params: {
//   to: string;
//   petName: string;
//   serviceType: "daycare" | "hotel";
//   daycareFormat: string | null;
//   startDate: string;
//   endDate: string | null;
// }): Promise<void> {
//   try {
//     if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
//       console.error("[booking-email] SMTP_* не настроены — письмо не отправлено");
//       return;
//     }
//     const transport = nodemailer.createTransport({
//       host: process.env.SMTP_HOST,
//       port: Number(process.env.SMTP_PORT ?? 465),
//       secure: Number(process.env.SMTP_PORT ?? 465) === 465,
//       auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
//     });
//     await transport.sendMail({
//       from: "Лапа Клуб <noreply@lapaclub.ru>",
//       to: params.to,
//       subject: "Бронь подтверждена — Лапа Клуб",
//       html: "…", // вёрстку письма см. в git-истории этого файла (Resend-версия)
//     });
//   } catch (e) {
//     // письмо вторично — никогда не роняем бронь
//     console.error("[booking-email] error:", e instanceof Error ? e.message : e);
//   }
// }

export {};
