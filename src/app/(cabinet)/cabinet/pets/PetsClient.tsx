"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PetForm } from "@/components/auth/PetForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, PawPrint, Pencil, Trash2 } from "lucide-react";
import type { Pet } from "@/types";

export function PetsClient({ initialPets }: { initialPets: Pet[] }) {
  const router = useRouter();
  const [pets, setPets] = useState(initialPets);
  const [mode, setMode] = useState<"list" | "add" | { edit: Pet }>("list");

  async function deletePet(id: string) {
    const supabase = createClient();
    const { data: active } = await supabase
      .from("bookings")
      .select("id")
      .eq("pet_id", id)
      .in("status", ["pending", "confirmed"])
      .limit(1);
    if (active?.length) {
      alert("Нельзя удалить питомца с активными бронированиями. Сначала отмените заявки.");
      return;
    }
    if (!confirm("Удалить питомца?")) return;
    const { error } = await supabase.from("pets").delete().eq("id", id);
    if (error) { alert("Не удалось удалить питомца: " + error.message); return; }
    setPets((prev) => prev.filter((p) => p.id !== id));
  }

  if (mode === "add") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Добавить питомца</h1>
        <div className="rounded-xl border p-6">
          <PetForm onSaved={() => { setMode("list"); router.refresh(); }} onCancel={() => setMode("list")} />
        </div>
      </div>
    );
  }

  if (typeof mode === "object") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Редактировать питомца</h1>
        <div className="rounded-xl border p-6">
          <PetForm pet={mode.edit} onSaved={() => { setMode("list"); router.refresh(); }} onCancel={() => setMode("list")} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Мои питомцы</h1>
          <p className="text-muted-foreground text-sm mt-1">Добавьте питомцев для быстрого бронирования</p>
        </div>
        <Button size="sm" onClick={() => setMode("add")}>
          <Plus className="h-4 w-4 mr-1" /> Добавить
        </Button>
      </div>

      {pets.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          <PawPrint className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p>Питомцев пока нет. Добавьте первого!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {pets.map((pet) => (
            <div key={pet.id} className="rounded-xl border p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-semibold text-lg">{pet.name}</div>
                  <Badge variant="outline" className="text-xs mt-1">
                    {pet.type === "dog" ? "Собака" : "Кошка"}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setMode({ edit: pet })} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => deletePet(pet.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                {pet.breed && <div>Порода: {pet.breed}</div>}
                {pet.weight_kg && <div>Вес: {pet.weight_kg} кг</div>}
                {pet.special_needs && <div className="text-amber-600">⚠ {pet.special_needs}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
