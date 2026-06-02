"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Введите имя"),
  phone: z.string().min(10, "Введите корректный номер"),
  message: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function ContactForm() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("contact_requests").insert(data);
    if (error) { setError("Не удалось отправить. Позвоните нам или напишите на email."); return; }
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-2xl border p-8 text-center">
        <div className="text-4xl mb-3">✓</div>
        <h3 className="font-semibold text-lg mb-1">Заявка отправлена</h3>
        <p className="text-muted-foreground text-sm">Свяжемся с вами в течение часа (8:00–20:00)</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Напишите нам</h3>
      </div>
      <p className="text-muted-foreground text-sm">Не хотите звонить? Оставьте заявку — перезвоним сами.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="c-name">Ваше имя</Label>
          <Input id="c-name" placeholder="Иван" {...register("name")} />
          {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-phone">Телефон</Label>
          <Input id="c-phone" type="tel" placeholder="+7 900 000 00 00" {...register("phone")} />
          {errors.phone && <p className="text-destructive text-xs">{errors.phone.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-msg">Вопрос или комментарий <span className="text-muted-foreground">(необязательно)</span></Label>
          <Input id="c-msg" placeholder="Расскажите о питомце или задайте вопрос..." {...register("message")} />
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Отправляем..." : "Отправить заявку"}
        </Button>
      </form>
    </div>
  );
}
