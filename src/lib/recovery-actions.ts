"use server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function sendPasswordRecovery(email: string): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const supabase = createAdminClient();

    const { data, error: linkError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
    });

    if (linkError) console.error("[recovery] generateLink error:", linkError.message);

    // Не раскрываем существование email — возвращаем success даже если email не найден
    if (!data?.properties?.hashed_token) return { success: true };

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
    const recoveryUrl = `${siteUrl}/auth/confirm?token_hash=${data.properties.hashed_token}&type=recovery`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Дог Клуб <onboarding@resend.dev>",
        to: [email],
        subject: "Сброс пароля — Дог Клуб",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
            <h2 style="margin:0 0 12px;color:#1a1a1a;">Сброс пароля</h2>
            <p style="color:#555;margin:0 0 24px;">Нажмите кнопку ниже, чтобы задать новый пароль.</p>
            <a href="${recoveryUrl}"
               style="display:inline-block;background:#8B6914;color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
              Сбросить пароль
            </a>
            <p style="color:#999;font-size:13px;margin-top:32px;line-height:1.5;">
              Ссылка действительна 1 час.<br>
              Если вы не запрашивали сброс — проигнорируйте это письмо.
            </p>
          </div>
        `,
      }),
    });

    const resendBody = await resendRes.text();
    if (!resendRes.ok) {
      console.error("[recovery] Resend error:", resendRes.status, resendBody);
      return { success: false, error: `Resend ${resendRes.status}: ${resendBody}` };
    }

    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[recovery] unexpected error:", msg);
    return { success: false, error: msg };
  }
}
