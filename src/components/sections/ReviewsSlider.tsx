import { createClient } from "@/lib/supabase/server";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ReviewRow } from "@/types";

export async function ReviewsSlider() {
  try {
    const supabase = await createClient();
    const { data: reviews } = await supabase
      .from("reviews")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(6);

    if (!reviews || reviews.length === 0) return null;

    return (
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Что говорят хозяева</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(reviews as ReviewRow[]).map((review) => (
              <Card key={review.id} className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    «{review.text}»
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{review.author_name}</span>
                    {review.pet_type && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {review.pet_type}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  } catch {
    return null;
  }
}
