"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { submitClientBooking, getAvailability } from "@/lib/booking-actions";
import { Button } from "@/components/ui/button";
import { AvailabilityCalendar } from "@/components/booking/AvailabilityCalendar";
import { QuickAddPet } from "@/components/booking/QuickAddPet";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import type { Pet, DayAvailability } from "@/types";
import { translateSupabaseError, formatCalendarDate, parseLocalDate } from "@/lib/utils";
import { useCountUp } from "@/hooks/useCountUp";

type FormErrors = Partial<Record<string, string>>;

type DaycarePrice = { service_type: string; label: string; price: number; unit: string };

const FALLBACK_PRICES: DaycarePrice[] = [
  { service_type: "daycare", label: "Час",         price: 400,  unit: "час" },
  { service_type: "daycare", label: "Полдня",      price: 1200, unit: "полдня" },
  { service_type: "daycare", label: "Полный день", price: 1800, unit: "день" },
];

const LABEL_TO_VALUE: Record<string, string> = {
  "Час": "hour", "час": "hour",
  "Полдня": "half_day", "полдня": "half_day",
  "Полный день": "full_day", "полный день": "full_day",
};

export function BookingForm({ pets, daycareprices, hotelNightly = 0 }: { pets: Pet[]; daycareprices?: DaycarePrice[]; hotelNightly?: number }) {
  const formats = (daycareprices && daycareprices.length > 0 ? daycareprices : FALLBACK_PRICES).map((p, i) => ({
    value: LABEL_TO_VALUE[p.label] ?? ["hour", "half_day", "full_day"][i] ?? `format_${i}`,
    label: p.label,
    price: `${p.price.toLocaleString("ru-RU")} ₽`,
    priceNum: p.price,
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

  const [petList, setPetList] = useState<Pet[]>(pets);
  const [addingPet, setAddingPet] = useState(pets.length === 0);

  const [availability, setAvailability] = useState<DayAvailability[] | null>(null);
  const [checkingAvail, setCheckingAvail] = useState(false);

  const selectedPet = petList.find((p) => p.id === petId);

  // Подгружаем доступность при изменении питомца/услуги/дат
  useEffect(() => {
    let cancelled = false;
    const ready = !!petId && !!selectedPet && !!startDate &&
      (serviceType === "daycare" || (!!endDate && endDate > startDate));

    async function run() {
      if (!ready) { setAvailability(null); return; }
      setCheckingAvail(true);
      try {
        const rows = await getAvailability({
          service_type: serviceType,
          pet_type: selectedPet!.type,
          start_date: startDate,
          end_date: serviceType === "hotel" ? endDate : null,
        });
        if (!cancelled) setAvailability(rows);
      } catch {
        if (!cancelled) setAvailability(null);
      } finally {
        if (!cancelled) setCheckingAvail(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [petId, serviceType, startDate, endDate, selectedPet]);

  const fullDates = availability?.filter((d) => d.remaining <= 0) ?? [];
  const minRemaining = availability && availability.length
    ? Math.min(...availability.map((d) => d.remaining)) : null;
  const availabilityBlocked = fullDates.length > 0;

  // Конструктор итоговой стоимости
  const nights = serviceType === "hotel" && startDate && endDate && endDate > startDate
    ? Math.round((parseLocalDate(endDate).getTime() - parseLocalDate(startDate).getTime()) / 86400000)
    : 0;
  const totalPrice = serviceType === "hotel"
    ? nights * hotelNightly
    : (formats.find((f) => f.value === daycareFormat)?.priceNum ?? 0);
  const animatedTotal = useCountUp(totalPrice);

  function validate(): boolean {
    const e: FormErrors = {};
    if (!petId) e.pet_id = "Выберите питомца";
    if (!startDate) e.start_date = "Выберите дату";
    if (serviceType === "hotel" && !endDate) e.end_date = "Укажите дату выезда";
    if (serviceType === "hotel" && endDate && endDate <= startDate) e.end_date = "Дата выезда должна быть позже даты заезда";
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

      await submitClientBooking({
        pet_id: petId,
        service_type: serviceType,
        daycare_format: serviceType === "daycare" ? daycareFormat : null,
        start_date: startDate,
        end_date: serviceType === "hotel" ? (endDate || null) : null,
        notes: notes || null,
      });

      setDone(true);
    } catch (e: unknown) {
      setServerError(e instanceof Error ? translateSupabaseError(e.message) : "Произошла ошибка. Попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Card className="border-0 shadow-sm text-center">
        <CardContent className="pt-10 pb-10">
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4 animate-in zoom-in-50 duration-500 motion-reduce:animate-none" />
          <h2 className="text-xl font-bold mb-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 motion-reduce:animate-none">Заявка принята!</h2>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto animate-in fade-in duration-500 delay-300 motion-reduce:animate-none">
            Подтверждение и статус появятся в{" "}
            <a href="/cabinet/bookings" className="text-primary underline">личном кабинете</a>{" "}
            — мы также напишем вам на почту.
          </p>
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
            {petList.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {petList.map((pet) => (
                  <label key={pet.id} className="cursor-pointer">
                    <input
                      type="radio"
                      name="pet_id"
                      value={pet.id}
                      checked={petId === pet.id}
                      onChange={() => setPetId(pet.id)}
                      className="sr-only peer"
                    />
                    <div className="rounded-xl border-2 p-3 peer-checked:border-primary peer-checked:bg-brand-light transition-all hover:border-primary/50">
                      <div className="font-medium text-sm">{pet.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {pet.type === "dog" ? "Собака" : "Кошка"}
                        {pet.breed ? ` · ${pet.breed}` : ""}
                      </div>
                    </div>
                  </label>
                ))}
                {!addingPet && (
                  <button
                    type="button"
                    onClick={() => setAddingPet(true)}
                    className="rounded-xl border-2 border-dashed p-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1"
                  >
                    + Питомец
                  </button>
                )}
              </div>
            )}

            {addingPet && (
              <QuickAddPet
                onAdded={(pet) => {
                  setPetList((prev) => [...prev, pet]);
                  setPetId(pet.id);
                  setAddingPet(false);
                }}
                onCancel={petList.length > 0 ? () => setAddingPet(false) : undefined}
              />
            )}
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
                    onChange={() => { setServiceType(s.value); setDaycareFormat(""); setStartDate(""); setEndDate(""); }}
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

          {/* Даты — календарь со свободными местами */}
          <div className="space-y-2">
            <Label>
              {serviceType === "hotel" ? "Даты заезда и выезда *" : "Дата посещения *"}
            </Label>
            <AvailabilityCalendar
              serviceType={serviceType}
              petType={selectedPet ? selectedPet.type : null}
              startDate={startDate}
              endDate={endDate}
              onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
            />
            {(startDate || endDate) && (
              <p className="text-sm text-muted-foreground">
                {serviceType === "hotel"
                  ? `Заезд: ${startDate ? formatCalendarDate(startDate) : "—"}${endDate ? ` · Выезд: ${formatCalendarDate(endDate)}` : ""}`
                  : startDate ? `Дата: ${formatCalendarDate(startDate)}` : ""}
              </p>
            )}
            {errors.start_date && <p className="text-destructive text-xs">{errors.start_date}</p>}
            {errors.end_date && <p className="text-destructive text-xs">{errors.end_date}</p>}
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

          {/* Доступность мест */}
          {checkingAvail && (
            <div className="h-9 rounded-lg bg-muted animate-pulse" />
          )}
          {!checkingAvail && availability && availability.length > 0 && (
            availabilityBlocked ? (
              <p className="text-sm bg-destructive/10 text-destructive px-3 py-2 rounded-lg">
                {serviceType === "hotel"
                  ? `Нет мест: ${fullDates.map((d) => formatCalendarDate(d.d)).join(", ")}. Выберите другой период.`
                  : "На эту дату мест нет — выберите другую."}
              </p>
            ) : (
              <p className="text-sm bg-green-50 text-green-700 px-3 py-2 rounded-lg">
                {serviceType === "hotel"
                  ? `Свободно на все даты (мин. ${minRemaining} мест)`
                  : `Свободно: ${minRemaining} мест`}
              </p>
            )
          )}

          {/* Итоговая стоимость */}
          {totalPrice > 0 && (
            <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-brand-light">
              <span className="font-medium">
                Итого{serviceType === "hotel" && nights > 0 ? ` · ${nights} ноч.` : ""}
              </span>
              <span className="text-lg font-bold text-primary">{animatedTotal.toLocaleString("ru-RU")} ₽</span>
            </div>
          )}

          {serverError && (
            <p className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">{serverError}</p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={submitting || checkingAvail || availabilityBlocked}>
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
