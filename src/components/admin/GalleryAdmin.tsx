"use client";
import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { deleteGalleryItem, addGalleryItem } from "@/lib/admin-actions";
import { Button } from "@/components/ui/button";
import { Trash2, Upload } from "lucide-react";
import type { GalleryItem } from "@/types";

// Сжимаем фото в браузере перед загрузкой: фото с телефона (iPhone) бывают
// по 5-12 МБ и не проходят в Storage / медленно грузятся по мобильной сети.
// createImageBitmap с imageOrientation:"from-image" корректно применяет
// EXIF-поворот, чтобы фото не легло боком.
const MAX_DIMENSION = 1920;

async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    let { width, height } = bitmap;
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82)
    );
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file; // не смогли сжать — грузим оригинал
  }
}

export function GalleryAdmin({ items: initial }: { items: GalleryItem[] }) {
  const [items, setItems] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setUploadError(null);
    const supabase = createClient();
    try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploadError("Сессия истекла — перезайдите в аккаунт"); setUploading(false); return; }
    const failed: string[] = [];
    let order = items.length;

    for (const original of Array.from(files)) {
      const file = await compressImage(original);
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage.from("gallery").upload(path, file, {
        contentType: file.type,
      });
      if (error) {
        console.error("[gallery] storage upload failed:", file.name, error);
        failed.push(`${original.name} — ${error.message}`);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage.from("gallery").getPublicUrl(data.path);
      try {
        const row = await addGalleryItem(publicUrl, original.name.replace(/\.[^.]+$/, ""), order++);
        if (row) {
          setItems((prev) => [...prev, row as GalleryItem]);
        } else {
          console.error("[gallery] addGalleryItem returned empty for", original.name);
          failed.push(`${original.name} — запись не сохранилась`);
        }
      } catch (e) {
        console.error("[gallery] addGalleryItem failed:", original.name, e);
        failed.push(`${original.name} — ${e instanceof Error ? e.message : "ошибка записи"}`);
      }
    }
    if (failed.length) setUploadError(`Не удалось загрузить:\n${failed.join("\n")}`);
    } catch (e) {
      console.error("[gallery] upload crashed:", e);
      setUploadError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(item: GalleryItem) {
    if (!confirm("Удалить фото?")) return;
    await deleteGalleryItem(item.id, item.url);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  }

  return (
    <div className="space-y-6">
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
        <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Загружаем..." : "Загрузить фото"}
        </Button>
        <p className="text-xs text-muted-foreground mt-2">Можно выбрать несколько. JPG, PNG, WebP.</p>
        {uploadError && <p className="text-destructive text-sm mt-2 whitespace-pre-line">{uploadError}</p>}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          Фото пока нет
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {items.map((item) => (
            <div key={item.id} className="relative group aspect-square rounded-xl overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt={item.alt} className="w-full h-full object-cover" loading="lazy" />
              <button
                onClick={() => handleDelete(item)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Trash2 className="h-6 w-6 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
