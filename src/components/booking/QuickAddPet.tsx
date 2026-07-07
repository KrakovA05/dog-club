"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { translateSupabaseError } from "@/lib/utils";
import type { Pet } from "@/types";

/** Компактное добавление питомца прямо в форме брони — без ухода со страницы. */
export function QuickAddPet({
  onAdded,
  onCancel,
}: {
  onAdded: (pet: Pet) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"dog" | "cat">("dog");
  const [breed, setBreed] = useState("");
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!name.trim()) { setError("Введите кличку"); return; }
    const w = weight ? Number(weight) : null;
    if (w !== null && (isNaN(w) || w <= 0)) { setError("Введите корректный вес"); return; }
    if (type === "dog" && w !== null && w > 15) { setError("Принимаем собак до 15 кг"); return; }

    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Войдите в аккаунт"); return; }
      const { data, error: e } = await supabase
        .from("pets")
        .insert({ owner_id: user.id, name: name.trim(), type, breed: breed.trim() || null, weight_kg: w })
        .select()
        .single();
      if (e) { setError(translateSupabaseError(e.message)); return; }
      onAdded(data as Pet);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось добавить питомца");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border p-4 space-y-3 bg-muted/20 animate-in fade-in slide-in-from-top-2 duration-300 motion-reduce:animate-none">
      <div className="font-medium text-sm">Новый питомец</div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Кличка *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Барсик" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Вид *</Label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "dog" | "cat")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="dog">Собака</option>
            <option value="cat">Кошка</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Порода</Label>
          <Input value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="Шпиц" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Вес, кг</Label>
          <Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="4.5" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Ветпаспорт обязателен при заселении — прикрепите его в кабинете или возьмите с собой.
      </p>
      {error && <p className="text-destructive text-xs">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={save} disabled={saving}>
          {saving ? "Сохраняем..." : "Добавить питомца"}
        </Button>
        {onCancel && (
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>Отмена</Button>
        )}
      </div>
    </div>
  );
}
