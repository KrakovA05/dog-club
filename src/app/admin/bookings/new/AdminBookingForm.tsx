"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBookingForClient } from "@/lib/admin-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileCheck, FileX } from "lucide-react";

interface Profile { id: string; full_name: string | null; phone: string | null; }
interface Pet {
  id: string; owner_id: string; name: string; type: string;
  breed: string | null; weight_kg: number | null;
  special_needs: string | null; passport_photo_url: string | null;
}

const today = new Date().toISOString().split("T")[0];

const FORMAT_OPTIONS = [
  { value: "hour",     label: "Час",         sub: "400 ₽" },
  { value: "half_day", label: "Полдня",      sub: "1 200 ₽" },
  { value: "full_day", label: "Полный день", sub: "1 800 ₽" },
];

export function AdminBookingForm({
  profiles,
  allPets,
  preselectedClientId,
}: {
  profiles: Profile[];
  allPets: Pet[];
  preselectedClientId?: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [clientId, setClientId] = useState(preselectedClientId ?? "");
  const [petId, setPetId] = useState("");
  const [serviceType, setServiceType] = useState<"daycare" | "hotel">("daycare");
  const [daycareFormat, setDaycareFormat] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const clientPets = allPets.filter((p) => p.owner_id === clientId);
  const selectedPet = allPets.find((p) => p.id === petId);
  const selectedClient = profiles.find((p) => p.id === clientId);

  function handleClientChange(id: string) {
    setClientId(id);
    setPetId(""); // сбрасываем питомца при смене клиента
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) { setError("Выберите клиента"); return; }
    if (!petId) { setError("Выберите питомца"); return; }
    if (!startDate) { setError("Укажите дату"); return; }
    if (serviceType === "daycare" && !daycareFormat) { setError("Выберите формат посещения"); return; }

    setSaving(true);
    setError(null);
    try {
      await createBookingForClient({
        user_id: clientId,
        pet_id: petId,
        service_type: serviceType,
        daycare_format: serviceType === "daycare" ? daycareFormat : null,
        start_date: startDate,
        end_date: serviceType === "hotel" ? (endDate || null) : null,
        notes: notes || null,
      });
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка при создании записи");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    const serviceLabel = serviceType === "hotel" ? "Гостиница" : "Детский сад";
    return (
      <div className="bg-background rounded-2xl border p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <FileCheck className="h-7 w-7 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Запись создана</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {selectedClient?.full_name ?? "Клиент"} — {selectedPet?.name} — {serviceLabel} — {startDate}
          </p>
          <p className="text-xs text-green-600 mt-1">Статус: Подтверждено</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button size="sm" onClick={() => router.push("/admin/calendar")}>
            Открыть календарь
          </Button>
          <Button size="sm" variant="outline" onClick={() => {
            setDone(false); setClientId(""); setPetId(""); setServiceType("daycare");
            setDaycareFormat(""); setStartDate(""); setEndDate(""); setNotes("");
          }}>
            Ещё одна запись
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>

      {/* Шаг 1: клиент */}
      <div className="bg-background rounded-2xl border p-5 space-y-4">
        <h2 className="font-semibold">1. Клиент</h2>
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
      </div>

      {/* Шаг 2: питомец */}
      {clientId && (
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
                    onChange={() => setPetId(pet.id)}
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
                    <a href={pet.passport_photo_url} target="_blank" rel="noopener noreferrer"
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

      {/* Шаг 3: услуга */}
      {petId && (
        <div className="bg-background rounded-2xl border p-5 space-y-4">
          <h2 className="font-semibold">3. Услуга и дата</h2>

          {/* Тип */}
          <div className="space-y-2">
            <Label>Услуга *</Label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: "daycare" as const, label: "Детский сад", sub: "до 11 часов" },
                { value: "hotel"   as const, label: "Гостиница",   sub: "от суток" },
              ] as const).map((s) => (
                <label key={s.value} className="cursor-pointer">
                  <input type="radio" name="service" value={s.value}
                    checked={serviceType === s.value}
                    onChange={() => { setServiceType(s.value); setDaycareFormat(""); }}
                    className="sr-only peer" />
                  <div className="rounded-xl border-2 p-3 peer-checked:border-primary peer-checked:bg-brand-light transition-all text-sm">
                    <div className="font-medium">{s.label}</div>
                    <div className="text-xs text-muted-foreground">{s.sub}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Формат для сада */}
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

          {/* Даты */}
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

          {/* Комментарий */}
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

      {error && (
        <p className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
      )}

      {petId && startDate && (
        <Button type="submit" className="w-full" size="lg" disabled={saving}>
          {saving ? "Создаём запись..." : "Подтвердить запись"}
        </Button>
      )}
    </form>
  );
}
