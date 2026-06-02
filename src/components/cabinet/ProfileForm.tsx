"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types";

const schema = z.object({
  full_name: z.string().min(2, "Введите имя (минимум 2 символа)"),
  phone: z.string().min(10, "Введите корректный номер телефона"),
});
type FormData = z.infer<typeof schema>;

export function ProfileForm({ profile }: { profile: Profile }) {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
    },
  });

  async function onSubmit(data: FormData) {
    setError(null);
    setSuccess(false);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: data.full_name, phone: data.phone })
      .eq("id", profile.id);
    if (error) {
      setError("Не удалось сохранить. Попробуйте снова.");
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Имя</Label>
        <Input id="full_name" placeholder="Иван Иванов" {...register("full_name")} />
        {errors.full_name && <p className="text-destructive text-xs">{errors.full_name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Телефон</Label>
        <Input id="phone" type="tel" placeholder="+7 900 000 00 00" {...register("phone")} />
        {errors.phone && <p className="text-destructive text-xs">{errors.phone.message}</p>}
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">Данные сохранены</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Сохраняем..." : "Сохранить"}
      </Button>
    </form>
  );
}
