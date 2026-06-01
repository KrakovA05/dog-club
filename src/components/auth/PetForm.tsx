"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Pet } from "@/types";

// Schema for form field values (all strings for input elements)
const schema = z.object({
  name: z.string().min(1, "Введите имя питомца"),
  type: z.enum(["dog", "cat"]),
  breed: z.string().optional(),
  birth_year: z.string().optional().refine(
    (v) => !v || (Number(v) >= 2000 && Number(v) <= 2030),
    { message: "Год от 2000 до 2030" }
  ),
  weight_kg: z.string().optional().refine(
    (v) => !v || (Number(v) >= 0.1 && Number(v) <= 15),
    { message: "Максимум 15 кг" }
  ),
  special_needs: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Props { pet?: Pet; onSaved: () => void; onCancel: () => void; }

export function PetForm({ pet, onSaved, onCancel }: Props) {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: pet ? {
      name: pet.name, type: pet.type,
      breed: pet.breed ?? "",
      birth_year: pet.birth_year != null ? String(pet.birth_year) : "",
      weight_kg: pet.weight_kg != null ? String(pet.weight_kg) : "",
      special_needs: pet.special_needs ?? "",
    } : { type: "dog" },
  });

  async function onSubmit(data: FormData) {
    setError(null);
    const supabase = createClient();
    const payload = {
      name: data.name, type: data.type,
      breed: data.breed || null,
      birth_year: data.birth_year ? Number(data.birth_year) : null,
      weight_kg: data.weight_kg ? Number(data.weight_kg) : null,
      special_needs: data.special_needs || null,
    };
    if (pet) {
      const { error: e } = await supabase.from("pets").update(payload).eq("id", pet.id);
      if (e) { setError(e.message); return; }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: e } = await supabase.from("pets").insert({ ...payload, owner_id: user!.id });
      if (e) { setError(e.message); return; }
    }
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Кличка *</Label>
          <Input placeholder="Барсик" {...register("name")} />
          {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Вид *</Label>
          <select {...register("type")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="dog">Собака</option>
            <option value="cat">Кошка</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Порода</Label>
          <Input placeholder="Шпиц" {...register("breed")} />
        </div>
        <div className="space-y-1.5">
          <Label>Год рождения</Label>
          <Input type="number" placeholder="2020" {...register("birth_year")} />
        </div>
        <div className="space-y-1.5">
          <Label>Вес, кг (до 15)</Label>
          <Input type="number" step="0.1" placeholder="4.5" {...register("weight_kg")} />
          {errors.weight_kg && <p className="text-destructive text-xs">{errors.weight_kg.message}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Особые потребности</Label>
        <Input placeholder="Диабет, аллергия на курицу..." {...register("special_needs")} />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Сохраняем..." : pet ? "Сохранить" : "Добавить питомца"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Отмена</Button>
      </div>
    </form>
  );
}
