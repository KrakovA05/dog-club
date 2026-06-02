import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ImageIcon } from "lucide-react";
import type { GalleryItem } from "@/types";

export const metadata: Metadata = {
  title: "Галерея — Дог Клуб Калуга",
  description: "Фото наших питомцев и заведения.",
};

export const revalidate = 3600;

async function getGallery(): Promise<GalleryItem[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("gallery").select("*").order("sort_order");
    return (data as GalleryItem[] | null) ?? [];
  } catch (e) {
    console.error("Gallery fetch error:", e);
    return [];
  }
}

export default async function GalleryPage() {
  const gallery = await getGallery();

  return (
    <>
      <section className="bg-brand-light py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Галерея</h1>
          <p className="text-muted-foreground text-lg">Наши питомцы и заведение</p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          {gallery.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-4">
              <ImageIcon className="h-16 w-16 opacity-20" />
              <p className="text-lg">Фотографии появятся совсем скоро</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.map((item) => (
                <div key={item.id} className="aspect-square rounded-xl overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.alt}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
