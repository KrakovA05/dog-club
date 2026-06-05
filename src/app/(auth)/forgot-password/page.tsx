"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { translateSupabaseError } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

const emailSchema = z.object({ email: z.string().email("Введите корректный email") });
const codeSchema = z.object({ code: z.string().length(6, "Код состоит из 6 символов") });

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [savedEmail, setSavedEmail] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const emailForm = useForm({ resolver: zodResolver(emailSchema) });
  const codeForm = useForm({ resolver: zodResolver(codeSchema) });

  async function onEmailSubmit({ email }: { email: string }) {
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {});
    setSavedEmail(email);
    setStep("code");
  }

  async function onCodeSubmit({ code }: { code: string }) {
    setVerifying(true);
    setVerifyError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: savedEmail,
      token: code,
      type: "recovery",
    });
    setVerifying(false);
    if (error) {
      setVerifyError(translateSupabaseError(error.message));
    } else {
      router.push("/reset-password");
    }
  }

  if (step === "code") {
    return (
      <div className="bg-card rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold mb-1">Введите код</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Отправили 6-значный код на <strong>{savedEmail}</strong>
        </p>

        <form onSubmit={codeForm.handleSubmit(onCodeSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="code">Код из письма</Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              className="text-center text-xl tracking-widest"
              {...codeForm.register("code")}
            />
            {codeForm.formState.errors.code && (
              <p className="text-destructive text-xs">{String(codeForm.formState.errors.code.message)}</p>
            )}
          </div>

          {verifyError && (
            <p className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">{verifyError}</p>
          )}

          <Button type="submit" className="w-full" disabled={verifying}>
            {verifying ? "Проверяем..." : "Подтвердить"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <button
            type="button"
            onClick={() => { setStep("email"); setVerifyError(null); }}
            className="text-primary font-medium hover:underline"
          >
            Отправить код повторно
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-sm p-8">
      <h1 className="text-2xl font-bold mb-1">Восстановление пароля</h1>
      <p className="text-muted-foreground text-sm mb-6">Отправим код подтверждения на email</p>

      <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...emailForm.register("email")} />
          {emailForm.formState.errors.email && (
            <p className="text-destructive text-xs">{String(emailForm.formState.errors.email.message)}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={emailForm.formState.isSubmitting}>
          {emailForm.formState.isSubmitting ? "Отправляем..." : "Отправить код"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        <Link href="/login" className="text-primary font-medium hover:underline">Вернуться ко входу</Link>
      </p>
    </div>
  );
}
