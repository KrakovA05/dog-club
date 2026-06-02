"use client";
import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { deleteGalleryItem, addGalleryItem } from "@/lib/admin-actions";
import { Button } from "@/components/ui/button";
import { Trash2, Upload } from "lucide-react";
import type { GalleryItem } from "@/types";

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

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage.from("gallery").upload(path, file);
      if (error) { failed.push(file.name); continue; }

      const { data: { publicUrl } } = supabase.storage.from("gallery").getPublicUrl(data.path);
      try {
        const row = await addGalleryItem(publicUrl, file.name.replace(/\.[^.]+$/, ""), order++);
        if (row) setItems((prev) => [...prev, row as GalleryItem]);
      } catch {
        failed.push(file.name);
      }
    }
    if (failed.length) setUploadError(`Не удалось загрузить: ${failed.join(", ")}`);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
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
        {uploadError && <p className="text-destructive text-sm mt-2">{uploadError}</p>}
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
