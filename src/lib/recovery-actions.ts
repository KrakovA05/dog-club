"use server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function sendPasswordRecovery(email: string): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { success: false, error: "SUPABASE_SERVICE_ROLE_KEY не настроен на сервере" };
    }
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: "RESEND_API_KEY не настроен на сервере" };
    }

    const supabase = createAdminClient();
    const { data, error: linkError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
    });

    if (linkError) {
      console.error("[recovery] generateLink error:", linkError.message);
      return { success: false, error: linkError.message };
    }

    // Не раскрываем существование email
    if (!data?.properties?.email_otp) return { success: true };

    const otp = data.properties.email_otp;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Лапа Клуб <onboarding@resend.dev>",
        to: [email],
        subject: "Код для сброса пароля — Лапа Клуб",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
            <h2 style="margin:0 0 12px;color:#1a1a1a;">Сброс пароля</h2>
            <p style="color:#555;margin:0 0 24px;">Ваш код для сброса пароля:</p>
            <div style="font-size:40px;font-weight:bold;letter-spacing:10px;color:#8B6914;text-align:center;padding:24px;background:#f9f5ee;border-radius:12px;margin-bottom:24px;">
              ${otp}
            </div>
            <p style="color:#999;font-size:13px;line-height:1.5;">
              Код действителен 1 час.<br>
              Если вы не запрашивали сброс — проигнорируйте это письмо.
            </p>
          </div>
        `,
      }),
    });

    if (!resendRes.ok) {
      const resendBody = await resendRes.text();
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

export async function verifyRecoveryOtp(email: string, token: string): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "recovery" });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}
