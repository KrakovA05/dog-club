"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { translateSupabaseError } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

const schema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});
type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") ?? "/cabinet";
  let redirect = "/cabinet";
  try {
    const url = new URL(rawRedirect, "http://localhost");
    if (url.origin === "http://localhost") redirect = rawRedirect;
  } catch { redirect = "/cabinet"; }
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setServerError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) {
        setServerError(translateSupabaseError(error.message));
        return;
      }
      window.location.assign(redirect);
    } catch (e) {
      setServerError(`Ошибка: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <div className="bg-card rounded-2xl shadow-sm p-8">
      <h1 className="text-2xl font-bold mb-1">Войти</h1>
      <p className="text-muted-foreground text-sm mb-6">В личный кабинет Лапа Клуб</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
          {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Пароль</Label>
            <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
              Забыли пароль?
            </Link>
          </div>
          <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
          {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
        </div>

        {serverError && (
          <p className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">{serverError}</p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Входим..." : "Войти"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Нет аккаунта?{" "}
        <Link href="/register" className="text-primary font-medium hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}
