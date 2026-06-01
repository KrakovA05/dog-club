"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

const schema = z.object({
  first_name: z.string().min(2, "Введите имя"),
  last_name: z.string().min(2, "Введите фамилию"),
  phone: z.string().min(10, "Введите корректный номер телефона"),
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
  confirm: z.string().min(1, "Повторите пароль"),
});
type FormData = z.infer<typeof schema>;

export function RegisterForm() {
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    if (data.password !== data.confirm) {
      setError("confirm", { message: "Пароли не совпадают" });
      return;
    }

    setServerError(null);
    const full_name = `${data.first_name.trim()} ${data.last_name.trim()}`;
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name, phone: data.phone.trim() },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
    if (error) {
      setServerError(
        error.message.includes("already registered")
          ? "Этот email уже зарегистрирован. Войдите или восстановите пароль."
          : error.message
      );
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="bg-card rounded-2xl shadow-sm p-8 text-center">
        <div className="text-5xl mb-4">📬</div>
        <h2 className="text-xl font-bold mb-2">Проверьте почту</h2>
        <p className="text-muted-foreground text-sm">
          Отправили письмо с подтверждением. Перейдите по ссылке в письме и вернитесь на сайт.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-sm p-8">
      <h1 className="text-2xl font-bold mb-1">Регистрация</h1>
      <p className="text-muted-foreground text-sm mb-6">Создайте личный кабинет</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="first_name">Имя *</Label>
            <Input id="first_name" placeholder="Иван" {...register("first_name")} />
            {errors.first_name && <p className="text-destructive text-xs">{errors.first_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last_name">Фамилия *</Label>
            <Input id="last_name" placeholder="Иванов" {...register("last_name")} />
            {errors.last_name && <p className="text-destructive text-xs">{errors.last_name.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Телефон *</Label>
          <Input id="phone" type="tel" placeholder="+7 (999) 000-00-00" {...register("phone")} />
          {errors.phone && <p className="text-destructive text-xs">{errors.phone.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
          {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Пароль *</Label>
          <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
          {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Повторите пароль *</Label>
          <Input id="confirm" type="password" placeholder="••••••••" {...register("confirm")} />
          {errors.confirm && <p className="text-destructive text-xs">{errors.confirm.message}</p>}
        </div>

        {serverError && (
          <p className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">{serverError}</p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Регистрируем..." : "Создать аккаунт"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">Войти</Link>
      </p>
    </div>
  );
}
