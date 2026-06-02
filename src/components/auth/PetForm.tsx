"use client";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Upload, X } from "lucide-react";
import type { Pet } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Введите кличку питомца"),
  passport_full_name: z.string().min(2, "Введите ФИО из ветпаспорта"),
  type: z.enum(["dog", "cat"] as const),
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
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [passportPreview, setPassportPreview] = useState<string | null>(pet?.passport_photo_url ?? null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: pet ? {
      name: pet.name,
      passport_full_name: pet.passport_full_name ?? "",
      type: pet.type,
      breed: pet.breed ?? "",
      birth_year: pet.birth_year != null ? String(pet.birth_year) : "",
      weight_kg: pet.weight_kg != null ? String(pet.weight_kg) : "",
      special_needs: pet.special_needs ?? "",
    } : { type: "dog" },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPassportPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setPassportFile(file);
  }

  async function uploadPassport(userId: string): Promise<string | null> {
    if (!passportFile) return pet?.passport_photo_url ?? null;
    setUploading(true);
    const supabase = createClient();

    // Удаляем старый файл если есть
    if (pet?.passport_photo_url) {
      const oldPath = pet.passport_photo_url.split("/passports/")[1];
      if (oldPath) await supabase.storage.from("passports").remove([oldPath]);
    }

    const ext = passportFile.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from("passports").upload(path, passportFile);
    setUploading(false);
    if (error) return null;
    const { data: { publicUrl } } = supabase.storage.from("passports").getPublicUrl(data.path);
    return publicUrl;
  }

  async function onSubmit(data: FormData) {
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Войдите в аккаунт"); return; }

    const passportUrl = passportFile ? await uploadPassport(user.id) : (pet?.passport_photo_url ?? null);
    if (passportFile && !passportUrl) { setError("Не удалось загрузить фото паспорта"); return; }

    const payload = {
      name: data.name,
      passport_full_name: data.passport_full_name,
      type: data.type,
      breed: data.breed || null,
      birth_year: data.birth_year ? Number(data.birth_year) : null,
      weight_kg: data.weight_kg ? Number(data.weight_kg) : null,
      special_needs: data.special_needs || null,
      passport_photo_url: passportUrl,
    };

    if (pet) {
      const { error: e } = await supabase.from("pets").update(payload).eq("id", pet.id).eq("owner_id", user.id);
      if (e) { setError(e.message); return; }
    } else {
      const { error: e } = await supabase.from("pets").insert({ ...payload, owner_id: user.id });
      if (e) { setError(e.message); return; }
    }
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Уведомление о паспорте */}
      {!pet && (
        <div className="flex gap-3 bg-brand-light border border-primary/20 rounded-xl px-4 py-3">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Мы принимаем только питомцев с ветеринарным паспортом. Загрузите его один раз —
            и при каждом визите брать с собой не придётся: все данные уже будут у нас.
          </p>
        </div>
      )}

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
          {errors.birth_year && <p className="text-destructive text-xs">{errors.birth_year.message}</p>}
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

      {/* Паспортные данные */}
      <div className="border-t pt-5 space-y-4">
        <div className="space-y-1.5">
          <Label>ФИО владельца из ветпаспорта *</Label>
          <Input placeholder="Иванов Иван Иванович" {...register("passport_full_name")} />
          {errors.passport_full_name && <p className="text-destructive text-xs">{errors.passport_full_name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>
            Фото ветпаспорта{" "}
            <span className="text-muted-foreground font-normal text-xs">(разворот с фото питомца и данными владельца)</span>
          </Label>

          {passportPreview ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={passportPreview}
                alt="Паспорт"
                className="h-36 w-auto rounded-xl border object-cover"
              />
              <button
                type="button"
                onClick={() => { setPassportFile(null); setPassportPreview((prev) => { if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev); return null; }); if (fileRef.current) fileRef.current.value = ""; }}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/80 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-input hover:border-primary hover:bg-brand-light transition-colors text-sm text-muted-foreground"
            >
              <Upload className="h-4 w-4" />
              Выбрать файл
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {error && <p className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting || uploading}>
          {uploading ? "Загружаем фото..." : isSubmitting ? "Сохраняем..." : pet ? "Сохранить" : "Добавить питомца"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Отмена</Button>
      </div>
    </form>
  );
}
