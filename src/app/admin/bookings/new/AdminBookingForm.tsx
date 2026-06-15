"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBookingForClient } from "@/lib/admin-actions";
import { getAvailability } from "@/lib/booking-actions";
import { formatCalendarDate, parseLocalDate, pickHotelNightly } from "@/lib/utils";
import { useCountUp } from "@/hooks/useCountUp";
import type { DayAvailability } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileCheck, FileX } from "lucide-react";

export interface Profile { id: string; full_name: string | null; phone: string | null; }
export interface Pet {
  id: string; owner_id: string; name: string; type: string;
  breed: string | null; weight_kg: number | null;
  special_needs: string | null; passport_photo_url: string | null;
}

const today = new Date().toISOString().split("T")[0];

const FALLBACK_FORMAT_OPTIONS = [
  { value: "hour",     label: "Час",         sub: "700 ₽" },
  { value: "half_day", label: "Полдня",      sub: "1 000 ₽" },
  { value: "full_day", label: "Полный день", sub: "1 200 ₽" },
];

export type DaycarePrice = { label: string; price: number };

const LABEL_TO_VALUE: Record<string, string> = {
  "Час": "hour", "час": "hour",
  "Полдня": "half_day", "полдня": "half_day",
  "Полный день": "full_day", "полный день": "full_day",
};

type Mode = "registered" | "guest";

export function AdminBookingForm({
  profiles,
  allPets,
  daycareprices,
  hotelPrices = [],
  preselectedClientId,
}: {
  profiles: Profile[];
  allPets: Pet[];
  daycareprices?: DaycarePrice[];
  hotelPrices?: { label: string; price: number }[];
  preselectedClientId?: string;
}) {
  const FORMAT_OPTIONS = (daycareprices && daycareprices.length > 0
    ? daycareprices.map((p, i) => ({
        value: LABEL_TO_VALUE[p.label] ?? ["hour", "half_day", "full_day"][i] ?? `format_${i}`,
        label: p.label,
        sub: `${p.price.toLocaleString("ru-RU")} ₽`,
        priceNum: p.price,
      }))
    : FALLBACK_FORMAT_OPTIONS.map((f) => ({ ...f, priceNum: 0 })));

  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Режим: существующий клиент или новый без регистрации
  const [mode, setMode] = useState<Mode>(preselectedClientId ? "registered" : "registered");

  // --- Поля существующего клиента ---
  const [clientId, setClientId] = useState(preselectedClientId ?? "");
  const [petId, setPetId] = useState("");

  // --- Поля гостевого клиента ---
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestPetName, setGuestPetName] = useState("");
  const [guestPetType, setGuestPetType] = useState<"dog" | "cat">("dog");
  const [guestPetBreed, setGuestPetBreed] = useState("");
  const [guestPetWeight, setGuestPetWeight] = useState("");

  // --- Общие поля ---
  const [serviceType, setServiceType] = useState<"daycare" | "hotel">("daycare");
  const [daycareFormat, setDaycareFormat] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const clientPets = allPets.filter((p) => p.owner_id === clientId);
  const selectedPet = mode === "registered" ? allPets.find((p) => p.id === petId) : null;
  const selectedClient = profiles.find((p) => p.id === clientId);

  // При смене режима сбрасываем поля и услугу
  function switchMode(m: Mode) {
    setMode(m);
    setClientId(""); setPetId("");
    setGuestName(""); setGuestPhone(""); setGuestPetName(""); setGuestPetBreed(""); setGuestPetWeight("");
    setGuestPetType("dog");
    setServiceType("daycare"); setDaycareFormat(""); setStartDate(""); setEndDate("");
    setError(null);
  }

  // Для гостевой брони: если кошка — автопереключаем в гостиницу
  const activePetType = mode === "registered" ? selectedPet?.type : guestPetType;
  const isCat = activePetType === "cat";
  useEffect(() => {
    if (isCat && serviceType === "daycare") {
      setServiceType("hotel"); setDaycareFormat(""); setStartDate(""); setEndDate("");
    }
  }, [isCat, serviceType]);

  function selectPet(id: string) {
    setPetId(id);
    const p = allPets.find((x) => x.id === id);
    if (p?.type === "cat" && serviceType === "daycare") {
      setServiceType("hotel"); setDaycareFormat(""); setStartDate(""); setEndDate("");
    }
  }

  // Готовность к показу блока услуги/даты
  const clientReady = mode === "registered"
    ? !!petId
    : !!guestPetName && !!guestPetType;

  const [availability, setAvailability] = useState<DayAvailability[] | null>(null);
  const [checkingAvail, setCheckingAvail] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const petType = mode === "registered" ? selectedPet?.type as "dog"|"cat"|undefined : guestPetType;
    const ready = !!petType && !!startDate &&
      (serviceType === "daycare" || (!!endDate && endDate > startDate));

    async function run() {
      if (!ready) { setAvailability(null); return; }
      setCheckingAvail(true);
      try {
        const rows = await getAvailability({
          service_type: serviceType,
          pet_type: petType!,
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
  }, [petId, guestPetType, mode, serviceType, startDate, endDate, selectedPet]);

  const fullDates = availability?.filter((d) => d.remaining <= 0) ?? [];
  const minRemaining = availability && availability.length
    ? Math.min(...availability.map((d) => d.remaining)) : null;
  const availabilityBlocked = fullDates.length > 0;

  const nights = serviceType === "hotel" && startDate && endDate && endDate > startDate
    ? Math.round((parseLocalDate(endDate).getTime() - parseLocalDate(startDate).getTime()) / 86400000)
    : 0;
  const petTypeForPrice = mode === "registered" ? (selectedPet?.type as "dog"|"cat"|undefined) : guestPetType;
  const hotelNightly = petTypeForPrice ? pickHotelNightly(petTypeForPrice, hotelPrices, nights) : 0;
  const totalPrice = serviceType === "hotel"
    ? nights * hotelNightly
    : (FORMAT_OPTIONS.find((f) => f.value === daycareFormat)?.priceNum ?? 0);
  const animatedTotal = useCountUp(totalPrice);

  function handleClientChange(id: string) {
    setClientId(id);
    setPetId("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "registered") {
      if (!clientId) { setError("Выберите клиента"); return; }
      if (!petId) { setError("Выберите питомца"); return; }
    } else {
      if (!guestName.trim()) { setError("Введите имя клиента"); return; }
      if (!guestPetName.trim()) { setError("Введите имя питомца"); return; }
    }
    if (!startDate) { setError("Укажите дату"); return; }
    if (serviceType === "hotel" && !endDate) { setError("Укажите дату выезда"); return; }
    if (serviceType === "hotel" && endDate && endDate <= startDate) { setError("Дата выезда должна быть позже даты заезда"); return; }
    if (serviceType === "daycare" && !daycareFormat) { setError("Выберите формат посещения"); return; }

    setSaving(true);
    try {
      if (mode === "registered") {
        await createBookingForClient({
          mode: "registered",
          user_id: clientId,
          pet_id: petId,
          service_type: serviceType,
          daycare_format: serviceType === "daycare" ? daycareFormat : null,
          start_date: startDate,
          end_date: serviceType === "hotel" ? (endDate || null) : null,
          notes: notes || null,
        });
      } else {
        await createBookingForClient({
          mode: "guest",
          guest_name: guestName.trim(),
          guest_phone: guestPhone.trim() || null,
          guest_pet_name: guestPetName.trim(),
          guest_pet_type: guestPetType,
          guest_pet_breed: guestPetBreed.trim() || null,
          guest_pet_weight: guestPetWeight ? parseFloat(guestPetWeight) : null,
          service_type: serviceType,
          daycare_format: serviceType === "daycare" ? daycareFormat : null,
          start_date: startDate,
          end_date: serviceType === "hotel" ? (endDate || null) : null,
          notes: notes || null,
        });
      }
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка при создании записи");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setDone(false); setClientId(""); setPetId("");
    setGuestName(""); setGuestPhone(""); setGuestPetName(""); setGuestPetBreed(""); setGuestPetWeight("");
    setGuestPetType("dog");
    setServiceType("daycare"); setDaycareFormat(""); setStartDate(""); setEndDate(""); setNotes("");
    setError(null);
  }

  if (done) {
    const serviceLabel = serviceType === "hotel" ? "Гостиница" : "Детский сад";
    const displayName = mode === "registered" ? (selectedClient?.full_name ?? "Клиент") : guestName;
    const displayPet = mode === "registered" ? (selectedPet?.name ?? "") : guestPetName;
    return (
      <div className="bg-background rounded-2xl border p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <FileCheck className="h-7 w-7 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Запись создана</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {displayName} — {displayPet} — {serviceLabel} — {startDate}
          </p>
          <p className="text-xs text-green-600 mt-1">Статус: Подтверждено</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button size="sm" onClick={() => router.push("/admin/calendar")}>
            Открыть календарь
          </Button>
          <Button size="sm" variant="outline" onClick={resetForm}>
            Ещё одна запись
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>

      {/* Переключатель режима */}
      <div className="bg-background rounded-2xl border p-5 space-y-4">
        <h2 className="font-semibold">1. Клиент</h2>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: "registered" as const, label: "Из базы", sub: "зарегистрированный" },
            { value: "guest"      as const, label: "Новый клиент", sub: "без регистрации" },
          ]).map((m) => (
            <label key={m.value} className="cursor-pointer">
              <input type="radio" name="mode" value={m.value}
                checked={mode === m.value}
                onChange={() => switchMode(m.value)}
                className="sr-only peer" />
              <div className="rounded-xl border-2 p-3 peer-checked:border-primary peer-checked:bg-brand-light transition-all text-sm text-center">
                <div className="font-medium">{m.label}</div>
                <div className="text-xs text-muted-foreground">{m.sub}</div>
              </div>
            </label>
          ))}
        </div>

        {/* Существующий клиент */}
        {mode === "registered" && (
          <div className="space-y-1.5">
            <Label>Выберите клиента *</Label>
            <select
              value={clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">— выберите клиента —</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name ?? "Без имени"}{p.phone ? ` · ${p.phone}` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Новый гостевой клиент */}
        {mode === "guest" && (
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Имя клиента *</Label>
                <Input
                  placeholder="Иван Петров"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Телефон</Label>
                <Input
                  type="tel"
                  placeholder="+7 (999) 000-00-00"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Питомец из базы */}
      {mode === "registered" && clientId && (
        <div className="bg-background rounded-2xl border p-5 space-y-4">
          <h2 className="font-semibold">2. Питомец</h2>
          {clientPets.length === 0 ? (
            <p className="text-muted-foreground text-sm">У этого клиента нет питомцев</p>
          ) : (
            <div className="space-y-2">
              {clientPets.map((pet) => (
                <label key={pet.id} className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-muted/30 transition-colors has-[:checked]:border-primary has-[:checked]:bg-brand-light">
                  <input
                    type="radio"
                    name="pet"
                    value={pet.id}
                    checked={petId === pet.id}
                    onChange={() => selectPet(pet.id)}
                    className="accent-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {pet.name}
                      <span className="text-muted-foreground font-normal ml-1.5 text-xs">
                        {pet.type === "dog" ? "собака" : "кошка"}
                        {pet.breed ? ` · ${pet.breed}` : ""}
                        {pet.weight_kg ? ` · ${pet.weight_kg} кг` : ""}
                      </span>
                    </div>
                    {pet.special_needs && (
                      <div className="text-xs text-orange-500 mt-0.5">{pet.special_needs}</div>
                    )}
                  </div>
                  {pet.passport_photo_url ? (
                    <a href={`/api/passport/${pet.id}`} target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-xs text-green-600 shrink-0 hover:underline">
                      <FileCheck className="h-3.5 w-3.5" /> Паспорт
                    </a>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-orange-400 shrink-0">
                      <FileX className="h-3.5 w-3.5" /> Нет паспорта
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Питомец гостевой */}
      {mode === "guest" && (
        <div className="bg-background rounded-2xl border p-5 space-y-4">
          <h2 className="font-semibold">2. Питомец</h2>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Вид *</Label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: "dog" as const, label: "Собака" },
                  { value: "cat" as const, label: "Кошка" },
                ]).map((t) => (
                  <label key={t.value} className="cursor-pointer">
                    <input type="radio" name="guest_pet_type" value={t.value}
                      checked={guestPetType === t.value}
                      onChange={() => setGuestPetType(t.value)}
                      className="sr-only peer" />
                    <div className="rounded-xl border-2 p-3 text-center peer-checked:border-primary peer-checked:bg-brand-light transition-all text-sm font-medium">
                      {t.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Кличка *</Label>
                <Input
                  placeholder="Бобик"
                  value={guestPetName}
                  onChange={(e) => setGuestPetName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Порода</Label>
                <Input
                  placeholder="Лабрадор"
                  value={guestPetBreed}
                  onChange={(e) => setGuestPetBreed(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Вес (кг)</Label>
              <Input
                type="number"
                min="0"
                max="50"
                step="0.1"
                placeholder="5.5"
                value={guestPetWeight}
                onChange={(e) => setGuestPetWeight(e.target.value)}
                className="max-w-[12rem]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Услуга и дата */}
      {clientReady && (
        <div className="bg-background rounded-2xl border p-5 space-y-4">
          <h2 className="font-semibold">3. Услуга и дата</h2>

          <div className="space-y-2">
            <Label>Услуга *</Label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: "daycare" as const, label: "Детский сад", sub: "до 11 часов" },
                { value: "hotel"   as const, label: "Гостиница",   sub: "от суток" },
              ] as const).map((s) => {
                const blocked = s.value === "daycare" && isCat;
                return (
                  <label key={s.value} className={blocked ? "cursor-not-allowed" : "cursor-pointer"}>
                    <input type="radio" name="service" value={s.value}
                      checked={serviceType === s.value}
                      disabled={blocked}
                      onChange={() => { setServiceType(s.value); setDaycareFormat(""); setStartDate(""); setEndDate(""); }}
                      className="sr-only peer" />
                    <div className="rounded-xl border-2 p-3 peer-checked:border-primary peer-checked:bg-brand-light transition-all peer-disabled:opacity-40 text-sm">
                      <div className="font-medium">{s.label}</div>
                      <div className="text-xs text-muted-foreground">{blocked ? "Только для собак" : s.sub}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {serviceType === "daycare" && (
            <div className="space-y-2">
              <Label>Формат *</Label>
              <div className="grid grid-cols-3 gap-2">
                {FORMAT_OPTIONS.map((f) => (
                  <label key={f.value} className="cursor-pointer">
                    <input type="radio" name="format" value={f.value}
                      checked={daycareFormat === f.value}
                      onChange={() => setDaycareFormat(f.value)}
                      className="sr-only peer" />
                    <div className="rounded-xl border-2 p-2.5 text-center peer-checked:border-primary peer-checked:bg-brand-light transition-all">
                      <div className="font-medium text-sm">{f.label}</div>
                      <div className="text-xs text-primary">{f.sub}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{serviceType === "hotel" ? "Дата заезда *" : "Дата посещения *"}</Label>
              <Input type="date" min={today} value={startDate}
                onChange={(e) => setStartDate(e.target.value)} />
            </div>
            {serviceType === "hotel" && (
              <div className="space-y-1.5">
                <Label>Дата выезда</Label>
                <Input type="date" min={startDate || today} value={endDate}
                  onChange={(e) => setEndDate(e.target.value)} />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Комментарий</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Особые пожелания, режим кормления, лекарства..."
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      )}

      {/* Доступность мест */}
      {clientReady && startDate && checkingAvail && (
        <div className="h-9 rounded-lg bg-muted animate-pulse" />
      )}
      {clientReady && startDate && !checkingAvail && availability && availability.length > 0 && (
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
      {clientReady && startDate && totalPrice > 0 && (
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-brand-light">
          <span className="font-medium">
            Итого{serviceType === "hotel" && nights > 0 ? ` · ${nights} ноч.` : ""}
          </span>
          <span className="text-lg font-bold text-primary">{animatedTotal.toLocaleString("ru-RU")} ₽</span>
        </div>
      )}

      {error && (
        <p className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
      )}

      {clientReady && startDate && (
        <Button type="submit" className="w-full" size="lg" disabled={saving || checkingAvail || availabilityBlocked}>
          {saving ? "Создаём запись..." : "Подтвердить запись"}
        </Button>
      )}
    </form>
  );
}
