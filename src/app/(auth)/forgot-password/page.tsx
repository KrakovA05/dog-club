"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { sendPasswordRecovery, verifyRecoveryOtp } from "@/lib/recovery-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

const emailSchema = z.object({ email: z.string().email("Введите корректный email") });
const codeSchema = z.object({ code: z.string().regex(/^\d{6,8}$/, "Введите код из письма") });

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const emailForm = useForm({ resolver: zodResolver(emailSchema) });
  const codeForm = useForm({ resolver: zodResolver(codeSchema) });

  async function onSendCode({ email: e }: { email: string }) {
    setServerError(null);
    const result = await sendPasswordRecovery(e);
    if (!result.success) { setServerError(result.error); return; }
    setEmail(e);
    setStep("code");
  }

  async function onVerifyCode({ code }: { code: string }) {
    setServerError(null);
    const result = await verifyRecoveryOtp(email, code);
    if (!result.success) { setServerError(result.error); return; }
    router.push("/reset-password");
  }

  if (step === "code") {
    return (
      <div className="bg-card rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold mb-1">Введите код</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Отправили код на <strong>{email}</strong>
        </p>

        <form onSubmit={codeForm.handleSubmit(onVerifyCode)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="code">Код из письма</Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={8}
              placeholder="12345678"
              autoComplete="one-time-code"
              className="text-center text-2xl tracking-widest"
              {...codeForm.register("code")}
            />
            {codeForm.formState.errors.code && (
              <p className="text-destructive text-xs">{codeForm.formState.errors.code.message as string}</p>
            )}
          </div>
          {serverError && (
            <p className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">{serverError}</p>
          )}
          <Button type="submit" className="w-full" disabled={codeForm.formState.isSubmitting}>
            {codeForm.formState.isSubmitting ? "Проверяем..." : "Подтвердить"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <button
            type="button"
            onClick={() => { setStep("email"); setServerError(null); }}
            className="text-primary font-medium hover:underline"
          >
            Изменить email
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-sm p-8">
      <h1 className="text-2xl font-bold mb-1">Восстановление пароля</h1>
      <p className="text-muted-foreground text-sm mb-6">Отправим код на ваш email</p>

      <form onSubmit={emailForm.handleSubmit(onSendCode)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...emailForm.register("email")} />
          {emailForm.formState.errors.email && (
            <p className="text-destructive text-xs">{emailForm.formState.errors.email.message as string}</p>
          )}
        </div>
        {serverError && (
          <p className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">{serverError}</p>
        )}
        <Button type="submit" className="w-full" disabled={emailForm.formState.isSubmitting}>
          {emailForm.formState.isSubmitting ? "Отправляем..." : "Получить код"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        <Link href="/login" className="text-primary font-medium hover:underline">Вернуться ко входу</Link>
      </p>
    </div>
  );
}
