"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { sendPasswordRecovery } from "@/lib/recovery-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

const schema = z.object({ email: z.string().email("Введите корректный email") });

export default function ForgotPasswordPage() {
  const [done, setDone] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  async function onSubmit({ email }: { email: string }) {
    await sendPasswordRecovery(email);
    setDone(true);
  }

  if (done) {
    return (
      <div className="bg-card rounded-2xl shadow-sm p-8 text-center">
        <div className="text-5xl mb-4">✉️</div>
        <h2 className="text-xl font-bold mb-2">Письмо отправлено</h2>
        <p className="text-muted-foreground text-sm">
          Если аккаунт с таким email существует — придёт ссылка для сброса пароля.
          Проверьте папку «Спам», если письмо не пришло.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-sm p-8">
      <h1 className="text-2xl font-bold mb-1">Восстановление пароля</h1>
      <p className="text-muted-foreground text-sm mb-6">Отправим ссылку на email</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
          {errors.email && <p className="text-destructive text-xs">{errors.email.message as string}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Отправляем..." : "Отправить ссылку"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        <Link href="/login" className="text-primary font-medium hover:underline">Вернуться ко входу</Link>
      </p>
    </div>
  );
}
