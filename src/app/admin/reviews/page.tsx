import { createClient } from "@/lib/supabase/server";
import { setReviewPublished, deleteReview } from "@/lib/admin-actions";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import type { ReviewRow } from "@/types";

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Отзывы</h1>

      {!reviews?.length ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          Отзывов пока нет
        </div>
      ) : (
        <div className="space-y-3">
          {(reviews as ReviewRow[]).map((r) => (
            <div key={r.id} className="bg-background rounded-xl border p-5">
              <div className="flex justify-between gap-4">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{r.author_name}</span>
                    {r.pet_type && (
                      <Badge variant="outline" className="text-xs">{r.pet_type}</Badge>
                    )}
                    {r.is_published
                      ? <Badge className="text-xs">Опубликован</Badge>
                      : <Badge variant="secondary" className="text-xs">Скрыт</Badge>
                    }
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-secondary text-secondary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{r.text}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <form action={setReviewPublished.bind(null, r.id, !r.is_published)}>
                    <button type="submit"
                      className="px-3 py-1.5 text-xs rounded-lg border hover:bg-muted transition-colors">
                      {r.is_published ? "Скрыть" : "Опубликовать"}
                    </button>
                  </form>
                  <form action={deleteReview.bind(null, r.id)}>
                    <button type="submit"
                      className="px-3 py-1.5 text-xs rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors">
                      Удалить
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
