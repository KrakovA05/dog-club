"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import type { Pet } from "@/types";

const today = new Date().toISOString().split("T")[0];

type FormErrors = Partial<Record<string, string>>;

type DaycarePrice = { service_type: string; label: string; price: number; unit: string };

const FALLBACK_PRICES: DaycarePrice[] = [
  { service_type: "daycare", label: "Час",         price: 400,  unit: "час" },
  { service_type: "daycare", label: "Полдня",      price: 1200, unit: "полдня" },
  { service_type: "daycare", label: "Полный день", price: 1800, unit: "день" },
];

export function BookingForm({ pets, daycareprices }: { pets: Pet[]; daycareprices?: DaycarePrice[] }) {
  const formats = (daycareprices && daycareprices.length > 0 ? daycareprices : FALLBACK_PRICES).map((p, i) => ({
    value: ["hour", "half_day", "full_day"][i] ?? `format_${i}`,
    label: p.label,
    price: `${p.price.toLocaleString("ru-RU")} ₽`,
  }));
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const [petId, setPetId] = useState("");
  const [serviceType, setServiceType] = useState<"daycare" | "hotel">("daycare");
  const [daycareFormat, setDaycareFormat] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  function validate(): boolean {
    const e: FormErrors = {};
    if (!petId) e.pet_id = "Выберите питомца";
    if (!startDate) e.start_date = "Выберите дату";
    if (serviceType === "hotel" && endDate && endDate < startDate) e.end_date = "Дата выезда не может быть раньше заезда";
    if (serviceType === "daycare" && !daycareFormat) e.daycare_format = "Выберите формат посещения";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setServerError("Войдите в аккаунт"); return; }

      const { data: petCheck } = await supabase
        .from("pets")
        .select("id")
        .eq("id", petId)
        .eq("owner_id", user.id)
        .single();
      if (!petCheck) { setServerError("Выбранный питомец не найден"); return; }

      const { error } = await supabase.from("bookings").insert({
        user_id: user.id,
        pet_id: petId,
        service_type: serviceType,
        daycare_format: serviceType === "daycare" ? daycareFormat : null,
        start_date: startDate,
        end_date: serviceType === "hotel" ? (endDate || null) : null,
        notes: notes || null,
        status: "pending",
      });

      if (error) { setServerError(error.message); return; }
      setDone(true);
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : "Произошла ошибка. Попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
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
            <a href="/cabinet/bookings" className="text-primary underline">личном кабинете</a>.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (pets.length === 0) {
    return (
      <Card className="border-0 shadow-sm text-center">
        <CardContent className="pt-10 pb-10">
          <p className="text-muted-foreground mb-4">Сначала добавьте питомца в личном кабинете</p>
          <Button render={<a href="/cabinet/pets">Добавить питомца</a>} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>

          {/* Питомец */}
          <div className="space-y-2">
            <Label>Питомец *</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {pets.map((pet) => (
                <label key={pet.id} className="cursor-pointer">
                  <input
                    type="radio"
                    name="pet_id"
                    value={pet.id}
                    checked={petId === pet.id}
                    onChange={() => setPetId(pet.id)}
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
            {errors.pet_id && <p className="text-destructive text-xs">{errors.pet_id}</p>}
          </div>

          {/* Тип услуги */}
          <div className="space-y-2">
            <Label>Услуга *</Label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: "daycare" as const, label: "Детский сад", sub: "до 11 часов" },
                { value: "hotel" as const,   label: "Гостиница",   sub: "от суток" },
              ] as const).map((s) => (
                <label key={s.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="service_type"
                    value={s.value}
                    checked={serviceType === s.value}
                    onChange={() => { setServiceType(s.value); setDaycareFormat(""); }}
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
                {formats.map((f) => (
                  <label key={f.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="daycare_format"
                      value={f.value}
                      checked={daycareFormat === f.value}
                      onChange={() => setDaycareFormat(f.value)}
                      className="sr-only peer"
                    />
                    <div className="rounded-xl border-2 p-3 text-center peer-checked:border-primary peer-checked:bg-brand-light transition-all">
                      <div className="font-medium text-sm">{f.label}</div>
                      <div className="text-xs text-primary font-medium">{f.price}</div>
                    </div>
                  </label>
                ))}
              </div>
              {errors.daycare_format && <p className="text-destructive text-xs">{errors.daycare_format}</p>}
            </div>
          )}

          {/* Даты */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{serviceType === "hotel" ? "Дата заезда *" : "Дата посещения *"}</Label>
              <Input
                type="date"
                min={today}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              {errors.start_date && <p className="text-destructive text-xs">{errors.start_date}</p>}
            </div>
            {serviceType === "hotel" && (
              <div className="space-y-1.5">
                <Label>Дата выезда</Label>
                <Input
                  type="date"
                  min={startDate || today}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                {errors.end_date && <p className="text-destructive text-xs">{errors.end_date}</p>}
              </div>
            )}
          </div>

          {/* Комментарий */}
          <div className="space-y-1.5">
            <Label>Комментарий</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Особые пожелания, режим кормления, лекарства..."
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {serverError && (
            <p className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">{serverError}</p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? "Отправляем заявку..." : "Отправить заявку"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            После отправки мы свяжемся для подтверждения. Оплата — при заселении.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
