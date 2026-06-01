"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import type { Pet } from "@/types";

const schema = z.object({
  pet_id: z.string().min(1, "Выберите питомца"),
  service_type: z.enum(["daycare", "hotel"] as const),
  daycare_format: z.enum(["hour", "half_day", "full_day"] as const).optional(),
  start_date: z.string().min(1, "Выберите дату"),
  end_date: z.string().optional(),
  notes: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

const today = new Date().toISOString().split("T")[0];

export function BookingForm({ pets }: { pets: Pet[] }) {
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { service_type: "daycare" },
  });

  const serviceType = watch("service_type");

  async function onSubmit(data: FormData) {
    if (data.service_type === "daycare" && !data.daycare_format) {
      setError("daycare_format", { message: "Выберите формат посещения" });
      return;
    }

    setServerError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setServerError("Войдите в аккаунт");
        return;
      }

      const { error } = await supabase.from("bookings").insert({
        user_id: user.id,
        pet_id: data.pet_id,
        service_type: data.service_type,
        daycare_format: data.service_type === "daycare" ? data.daycare_format : null,
        start_date: data.start_date,
        end_date: data.service_type === "hotel" ? (data.end_date || null) : null,
        notes: data.notes || null,
        status: "pending",
      });

      if (error) {
        setServerError(error.message);
        return;
      }
      setDone(true);
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : "Произошла ошибка. Попробуйте ещё раз.");
    }
  }

  if (done) {
    return (
      <Card className="border-0 shadow-sm text-center">
        <CardContent className="pt-10 pb-10">
          <CheckCircle2 className="h-14 w-14 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Заявка отправлена!</h2>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Мы свяжемся с вами в течение нескольких часов для подтверждения.
            Следить за статусом можно в{" "}
            <a href="/cabinet/bookings" className="text-primary underline">
              личном кабинете
            </a>
            .
          </p>
        </CardContent>
      </Card>
    );
  }

  if (pets.length === 0) {
    return (
      <Card className="border-0 shadow-sm text-center">
        <CardContent className="pt-10 pb-10">
          <p className="text-muted-foreground mb-4">
            Сначала добавьте питомца в личном кабинете
          </p>
          <Button render={<a href="/cabinet/pets">Добавить питомца</a>} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {/* Питомец */}
          <div className="space-y-2">
            <Label>Питомец *</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {pets.map((pet) => (
                <label key={pet.id} className="cursor-pointer">
                  <input
                    type="radio"
                    value={pet.id}
                    {...register("pet_id")}
                    className="sr-only peer"
                  />
                  <div className="rounded-xl border-2 p-3 peer-checked:border-primary peer-checked:bg-brand-light transition-all">
                    <div className="font-medium text-sm">{pet.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {pet.type === "dog" ? "Собака" : "Кошка"}
                      {pet.breed ? ` · ${pet.breed}` : ""}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {errors.pet_id && (
              <p className="text-destructive text-xs">{errors.pet_id.message}</p>
            )}
          </div>

          {/* Тип услуги */}
          <div className="space-y-2">
            <Label>Услуга *</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "daycare", label: "Детский сад", sub: "до 11 часов" },
                { value: "hotel", label: "Гостиница", sub: "от суток" },
              ].map((s) => (
                <label key={s.value} className="cursor-pointer">
                  <input
                    type="radio"
                    value={s.value}
                    {...register("service_type")}
                    className="sr-only peer"
                  />
                  <div className="rounded-xl border-2 p-4 peer-checked:border-primary peer-checked:bg-brand-light transition-all">
                    <div className="font-medium">{s.label}</div>
                    <div className="text-xs text-muted-foreground">{s.sub}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Формат (только детский сад) */}
          {serviceType === "daycare" && (
            <div className="space-y-2">
              <Label>Формат *</Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "hour", label: "Час", price: "400 ₽" },
                  { value: "half_day", label: "Полдня", price: "1 200 ₽" },
                  { value: "full_day", label: "Полный день", price: "1 800 ₽" },
                ].map((f) => (
                  <label key={f.value} className="cursor-pointer">
                    <input
                      type="radio"
                      value={f.value}
                      {...register("daycare_format")}
                      className="sr-only peer"
                    />
                    <div className="rounded-xl border-2 p-3 text-center peer-checked:border-primary peer-checked:bg-brand-light transition-all">
                      <div className="font-medium text-sm">{f.label}</div>
                      <div className="text-xs text-primary font-medium">{f.price}</div>
                    </div>
                  </label>
                ))}
              </div>
              {errors.daycare_format && (
                <p className="text-destructive text-xs">{errors.daycare_format.message}</p>
              )}
            </div>
          )}

          {/* Даты */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>
                {serviceType === "hotel" ? "Дата заезда *" : "Дата посещения *"}
              </Label>
              <Input type="date" min={today} {...register("start_date")} />
              {errors.start_date && (
                <p className="text-destructive text-xs">{errors.start_date.message}</p>
              )}
            </div>
            {serviceType === "hotel" && (
              <div className="space-y-1.5">
                <Label>Дата выезда</Label>
                <Input type="date" min={today} {...register("end_date")} />
              </div>
            )}
          </div>

          {/* Комментарий */}
          <div className="space-y-1.5">
            <Label>Комментарий</Label>
            <textarea
              {...register("notes")}
              placeholder="Особые пожелания, режим кормления, лекарства..."
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {serverError && (
            <p className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Отправляем заявку..." : "Отправить заявку"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            После отправки мы свяжемся для подтверждения. Оплата — при заселении.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
