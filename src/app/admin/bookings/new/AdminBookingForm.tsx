"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBookingForClient } from "@/lib/admin-actions";
import { getAvailability } from "@/lib/booking-actions";
import { formatCalendarDate, parseLocalDate, pickHotelNightly } from "@/lib/utils";
import type { DayAvailability } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileCheck, FileX, Search, X, Plus } from "lucide-react";

export interface Profile { id: string; full_name: string | null; phone: string | null; }
export interface Pet {
  id: string; owner_id: string; name: string; type: string;
  breed: string | null; weight_kg: number | null;
  special_needs: string | null; passport_photo_url: string | null;
}
export interface PastGuest {
  guest_name: string | null;
  guest_phone: string | null;
  guest_pet_name: string | null;
  guest_pet_type: string | null;
  guest_pet_breed: string | null;
  guest_pet_weight: number | null;
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

// Маска телефона: прогрессивное форматирование +7 (XXX) XXX-XX-XX
function formatPhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("8")) d = "7" + d.slice(1);
  if (!d.startsWith("7")) d = "7" + d;
  d = d.slice(0, 11);
  const p = d.slice(1);
  let out = "+7";
  if (p.length > 0) out += " (" + p.slice(0, 3);
  if (p.length >= 3) out += ")";
  if (p.length > 3) out += " " + p.slice(3, 6);
  if (p.length > 6) out += "-" + p.slice(6, 8);
  if (p.length > 8) out += "-" + p.slice(8, 10);
  return out;
}

export function AdminBookingForm({
  profiles,
  allPets,
  daycareprices,
  hotelPrices = [],
  preselectedClientId,
  presetDate,
  pastGuests = [],
}: {
  profiles: Profile[];
  allPets: Pet[];
  daycareprices?: DaycarePrice[];
  hotelPrices?: { label: string; price: number }[];
  preselectedClientId?: string;
  presetDate?: string;
  pastGuests?: PastGuest[];
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
  const [result, setResult] = useState<{ created: number; failed: { date: string; reason: string }[] } | null>(null);

  const [mode, setMode] = useState<Mode>("registered");

  // --- Существующий клиент (с поиском) ---
  const [clientId, setClientId] = useState(preselectedClientId ?? "");
  const [petId, setPetId] = useState("");
  const [clientSearch, setClientSearch] = useState(
    preselectedClientId ? (profiles.find((p) => p.id === preselectedClientId)?.full_name ?? "") : ""
  );
  const [clientOpen, setClientOpen] = useState(false);

  // --- Гостевой клиент ---
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestPetName, setGuestPetName] = useState("");
  const [guestPetType, setGuestPetType] = useState<"dog" | "cat">("dog");
  const [guestPetBreed, setGuestPetBreed] = useState("");
  const [guestPetWeight, setGuestPetWeight] = useState("");
  const [passportChecked, setPassportChecked] = useState(false);
  const [guestField, setGuestField] = useState<"name" | "phone" | null>(null);

  // --- Общие ---
  const [serviceType, setServiceType] = useState<"daycare" | "hotel">("daycare");
  const [daycareFormat, setDaycareFormat] = useState("");
  const [startDate, setStartDate] = useState(presetDate ?? "");
  const [endDate, setEndDate] = useState("");
  const [extraDates, setExtraDates] = useState<string[]>([]); // доп. даты детсада
  const [newExtraDate, setNewExtraDate] = useState("");
  const [notes, setNotes] = useState("");

  // --- Цена (редактируемая) ---
  // null = не переопределена (показываем расчётную); строка = ручное значение
  const [priceOverride, setPriceOverride] = useState<string | null>(null);

  const clientPets = allPets.filter((p) => p.owner_id === clientId);
  const selectedPet = mode === "registered" ? allPets.find((p) => p.id === petId) : null;
  const selectedClient = profiles.find((p) => p.id === clientId);

  // Поиск клиента
  const filteredProfiles = profiles.filter((p) => {
    const q = clientSearch.trim().toLowerCase();
    if (!q || p.id === clientId) return !q ? true : false;
    return (p.full_name ?? "").toLowerCase().includes(q) || (p.phone ?? "").includes(q.replace(/\D/g, ""));
  }).slice(0, 40);

  // Поиск повторного гостя (по имени ≥2 симв. ИЛИ телефону ≥3 цифр)
  const nameQuery = guestName.trim().toLowerCase();
  const phoneQuery = guestPhone.replace(/\D/g, "");
  const guestMatches = (nameQuery.length >= 2 || phoneQuery.length >= 3)
    ? pastGuests.filter((g) => {
        const byName = nameQuery.length >= 2 && (g.guest_name ?? "").toLowerCase().includes(nameQuery);
        const byPhone = phoneQuery.length >= 3 && (g.guest_phone ?? "").replace(/\D/g, "").includes(phoneQuery);
        return byName || byPhone;
      }).slice(0, 6)
    : [];

  function switchMode(m: Mode) {
    setMode(m);
    setClientId(""); setPetId(""); setClientSearch("");
    setGuestName(""); setGuestPhone(""); setGuestPetName(""); setGuestPetBreed(""); setGuestPetWeight("");
    setGuestPetType("dog"); setPassportChecked(false);
    setServiceType("daycare"); setDaycareFormat(""); setStartDate(presetDate ?? ""); setEndDate("");
    setExtraDates([]); setNewExtraDate("");
    setPriceOverride(null); setError(null);
  }

  function fillFromGuest(g: PastGuest) {
    setGuestName(g.guest_name ?? "");
    setGuestPhone(g.guest_phone ?? "");
    setGuestPetName(g.guest_pet_name ?? "");
    setGuestPetType(g.guest_pet_type === "cat" ? "cat" : "dog");
    setGuestPetBreed(g.guest_pet_breed ?? "");
    setGuestPetWeight(g.guest_pet_weight != null ? String(g.guest_pet_weight) : "");
    forceHotelIfCat(g.guest_pet_type ?? undefined);
    setGuestField(null);
  }

  function renderGuestSuggestions() {
    if (guestMatches.length === 0) return null;
    return (
      <div className="absolute z-20 left-0 right-0 mt-1 max-h-60 overflow-auto rounded-xl border bg-background shadow-lg">
        {guestMatches.map((g, i) => (
          <button key={i} type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => fillFromGuest(g)}
            className="flex w-full flex-col px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors">
            <span className="font-medium">{g.guest_name}{g.guest_phone ? ` · ${g.guest_phone}` : ""}</span>
            <span className="text-xs text-muted-foreground">
              {g.guest_pet_name} · {g.guest_pet_type === "dog" ? "собака" : "кошка"}{g.guest_pet_breed ? ` · ${g.guest_pet_breed}` : ""}
            </span>
          </button>
        ))}
      </div>
    );
  }

  const activePetType = mode === "registered" ? selectedPet?.type : guestPetType;
  const isCat = activePetType === "cat";

  // Кошек в детсад не берём — переключаем на гостиницу в момент выбора вида
  function forceHotelIfCat(petType: string | undefined) {
    if (petType === "cat" && serviceType === "daycare") {
      setServiceType("hotel"); setDaycareFormat(""); setExtraDates([]); setEndDate("");
    }
  }

  function selectPet(id: string) {
    setPetId(id);
    const p = allPets.find((x) => x.id === id);
    if (p?.type === "cat" && serviceType === "daycare") {
      setServiceType("hotel"); setDaycareFormat(""); setStartDate(presetDate ?? ""); setEndDate("");
    }
  }

  const clientReady = mode === "registered" ? !!petId : !!guestPetName && !!guestPetType;

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
  // Цена за ОДНУ запись (для детсада с мультидатами — за день)
  const unitPrice = serviceType === "hotel"
    ? nights * hotelNightly
    : (FORMAT_OPTIONS.find((f) => f.value === daycareFormat)?.priceNum ?? 0);

  // Отображаемая цена: ручная если переопределена, иначе расчётная (без эффекта)
  const displayPrice = priceOverride !== null ? priceOverride : (unitPrice ? String(unitPrice) : "");

  // Список всех дат детсада (основная + дополнительные, уникальные)
  const daycareAllDates = serviceType === "daycare"
    ? Array.from(new Set([startDate, ...extraDates].filter(Boolean))).sort()
    : [];

  function addExtraDate() {
    if (!newExtraDate) return;
    if (newExtraDate === startDate || extraDates.includes(newExtraDate)) { setNewExtraDate(""); return; }
    setExtraDates((prev) => [...prev, newExtraDate].sort());
    setNewExtraDate("");
  }

  function handleClientChange(id: string) {
    setClientId(id);
    setPetId("");
    setClientSearch(profiles.find((p) => p.id === id)?.full_name ?? "");
    setClientOpen(false);
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

    const priceNum = Number(displayPrice);
    const priceTotal = displayPrice.trim() && Number.isFinite(priceNum) ? Math.max(0, Math.round(priceNum)) : null;
    const finalNotes = (mode === "guest" && passportChecked)
      ? `✅ Ветпаспорт проверен.${notes ? " " + notes : ""}`
      : (notes || null);

    // Лимит веса: принимаем собак до 15 кг (кошки — без ограничений)
    if (mode === "guest" && guestPetType === "dog" && guestPetWeight
        && parseFloat(guestPetWeight) > 15) {
      setError("Принимаем собак до 15 кг — проверьте вес питомца");
      return;
    }

    setSaving(true);
    try {
      let res;
      if (mode === "registered") {
        res = await createBookingForClient({
          mode: "registered",
          user_id: clientId,
          pet_id: petId,
          service_type: serviceType,
          daycare_format: serviceType === "daycare" ? daycareFormat : null,
          start_date: startDate,
          end_date: serviceType === "hotel" ? (endDate || null) : null,
          daycare_dates: serviceType === "daycare" ? daycareAllDates : null,
          notes: finalNotes,
          price_total: priceTotal,
        });
      } else {
        res = await createBookingForClient({
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
          daycare_dates: serviceType === "daycare" ? daycareAllDates : null,
          notes: finalNotes,
          price_total: priceTotal,
        });
      }
      setResult(res);
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка при создании записи");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setDone(false); setResult(null);
    setClientId(""); setPetId(""); setClientSearch("");
    setGuestName(""); setGuestPhone(""); setGuestPetName(""); setGuestPetBreed(""); setGuestPetWeight("");
    setGuestPetType("dog"); setPassportChecked(false);
    setServiceType("daycare"); setDaycareFormat(""); setStartDate(presetDate ?? ""); setEndDate("");
    setExtraDates([]); setNewExtraDate(""); setNotes("");
    setPriceOverride(null); setError(null);
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
          <h2 className="text-xl font-bold">
            {result && result.created > 1 ? `Создано записей: ${result.created}` : "Запись создана"}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {displayName} — {displayPet} — {serviceLabel}
          </p>
          <p className="text-xs text-green-600 mt-1">Статус: Подтверждено</p>
          {result && result.failed.length > 0 && (
            <p className="text-xs text-orange-600 mt-2">
              Не прошли по местам: {result.failed.map((f) => f.date).join(", ")}
            </p>
          )}
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

        {/* Существующий клиент — поиск */}
        {mode === "registered" && (
          <div className="space-y-1.5 relative">
            <Label>Выберите клиента *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                value={clientSearch}
                onChange={(e) => { setClientSearch(e.target.value); setClientId(""); setPetId(""); setClientOpen(true); }}
                onFocus={() => setClientOpen(true)}
                onBlur={() => setTimeout(() => setClientOpen(false), 150)}
                placeholder="Поиск по имени или телефону…"
                className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {clientId && (
                <button type="button" onClick={() => { setClientId(""); setClientSearch(""); setPetId(""); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {clientOpen && filteredProfiles.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 max-h-60 overflow-auto rounded-xl border bg-background shadow-lg">
                {filteredProfiles.map((p) => (
                  <button key={p.id} type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleClientChange(p.id)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors">
                    <span className="font-medium">{p.full_name ?? "Без имени"}</span>
                    {p.phone && <span className="text-xs text-muted-foreground">{p.phone}</span>}
                  </button>
                ))}
              </div>
            )}
            {clientOpen && clientSearch.trim() && filteredProfiles.length === 0 && !clientId && (
              <p className="text-xs text-muted-foreground pt-1">Не найдено. Возможно, это новый клиент — переключите на «Новый клиент».</p>
            )}
          </div>
        )}

        {/* Новый гостевой клиент */}
        {mode === "guest" && (
          <div className="space-y-3">
            {pastGuests.length > 0 && (
              <p className="text-xs text-muted-foreground">
                💡 Начните вводить имя или телефон — если клиент уже был, данные подставятся.
              </p>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 relative">
                <Label>Имя клиента *</Label>
                <Input
                  placeholder="Иван Петров"
                  value={guestName}
                  onChange={(e) => { setGuestName(e.target.value); setGuestField("name"); }}
                  onFocus={() => setGuestField("name")}
                  onBlur={() => setTimeout(() => setGuestField((f) => f === "name" ? null : f), 150)}
                />
                {guestField === "name" && renderGuestSuggestions()}
              </div>
              <div className="space-y-1.5 relative">
                <Label>Телефон</Label>
                <Input
                  type="tel"
                  placeholder="+7 (999) 000-00-00"
                  value={guestPhone}
                  onChange={(e) => { setGuestPhone(formatPhone(e.target.value)); setGuestField("phone"); }}
                  onFocus={() => setGuestField("phone")}
                  onBlur={() => setTimeout(() => setGuestField((f) => f === "phone" ? null : f), 150)}
                />
                {guestField === "phone" && renderGuestSuggestions()}
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
                      onChange={() => { setGuestPetType(t.value); forceHotelIfCat(t.value); }}
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
                <Input placeholder="Бобик" value={guestPetName} onChange={(e) => setGuestPetName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Порода</Label>
                <Input placeholder="Лабрадор" value={guestPetBreed} onChange={(e) => setGuestPetBreed(e.target.value)} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 items-end">
              <div className="space-y-1.5">
                <Label>Вес (кг)</Label>
                <Input type="number" min="0" max="50" step="0.1" placeholder="5.5"
                  value={guestPetWeight} onChange={(e) => setGuestPetWeight(e.target.value)} />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer select-none pb-2">
                <input type="checkbox" checked={passportChecked}
                  onChange={(e) => setPassportChecked(e.target.checked)}
                  className="h-4 w-4 accent-primary cursor-pointer" />
                <span className="text-sm">Ветпаспорт проверен</span>
              </label>
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
                      onChange={() => { setServiceType(s.value); setDaycareFormat(""); setStartDate(presetDate ?? ""); setEndDate(""); setExtraDates([]); }}
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

          {/* Доп. даты детсада */}
          {serviceType === "daycare" && (
            <div className="space-y-2">
              <Label>Ещё даты (необязательно)</Label>
              <p className="text-xs text-muted-foreground">Запишем на каждую дату отдельно тем же форматом.</p>
              <div className="flex gap-2">
                <Input type="date" min={today} value={newExtraDate}
                  onChange={(e) => setNewExtraDate(e.target.value)} className="max-w-[12rem]" />
                <Button type="button" variant="outline" size="sm" onClick={addExtraDate} disabled={!newExtraDate}>
                  <Plus className="h-4 w-4 mr-1" /> Добавить
                </Button>
              </div>
              {extraDates.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {extraDates.map((d) => (
                    <span key={d} className="inline-flex items-center gap-1 rounded-full bg-brand-light px-2.5 py-1 text-xs">
                      {formatCalendarDate(d)}
                      <button type="button" onClick={() => setExtraDates((prev) => prev.filter((x) => x !== d))}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {daycareAllDates.length > 1 && (
                <p className="text-xs text-primary">Будет создано записей: {daycareAllDates.length}</p>
              )}
            </div>
          )}

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

      {/* Цена (редактируемая) */}
      {clientReady && startDate && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-brand-light">
          <span className="font-medium">
            {daycareAllDates.length > 1 ? "Цена за день" : "Итого"}
            {serviceType === "hotel" && nights > 0 ? ` · ${nights} ноч.` : ""}
          </span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              step="50"
              value={displayPrice}
              onChange={(e) => setPriceOverride(e.target.value)}
              placeholder={unitPrice ? String(unitPrice) : "0"}
              className="h-9 w-28 rounded-md border border-input bg-background px-3 text-right text-lg font-bold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <span className="text-lg font-bold text-primary">₽</span>
            {priceOverride !== null && (
              <button type="button" title="Вернуть расчётную"
                onClick={() => setPriceOverride(null)}
                className="ml-1 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
      {clientReady && startDate && daycareAllDates.length > 1 && displayPrice && (
        <p className="text-xs text-muted-foreground -mt-3 px-1 text-right">
          Всего за {daycareAllDates.length} дн.: {(Number(displayPrice) * daycareAllDates.length).toLocaleString("ru-RU")} ₽
        </p>
      )}

      {error && (
        <p className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
      )}

      {clientReady && startDate && (
        <Button type="submit" className="w-full" size="lg" disabled={saving || checkingAvail || availabilityBlocked}>
          {saving ? "Создаём запись..." : daycareAllDates.length > 1 ? `Создать ${daycareAllDates.length} записи` : "Подтвердить запись"}
        </Button>
      )}
    </form>
  );
}
