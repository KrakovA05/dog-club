import { createClient } from "@/lib/supabase/server";
import { CountUp } from "@/components/ui/count-up";

export async function StatsSection() {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating")
    .eq("is_published", true);

  const reviewCount = reviews?.length ?? 0;
  const avgRating =
    reviewCount > 0
      ? (reviews!.reduce((s, r) => s + r.rating, 0) / reviewCount).toFixed(1)
      : "5.0";

  const stats = [
    { value: 4, suffix: " года", label: "Работаем для вас" },
    { value: 200, suffix: "+", label: "Счастливых питомцев" },
    { value: 1000, suffix: "+", label: "Ночей в гостинице" },
    { value: parseFloat(avgRating) * 10, suffix: "", label: "Рейтинг клиентов", display: avgRating },
  ];

  return (
    <section className="py-14 bg-primary text-primary-foreground">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="text-4xl md:text-5xl font-bold mb-2">
                {stat.display ? (
                  stat.display
                ) : (
                  <CountUp end={stat.value} suffix={stat.suffix} />
                )}
              </div>
              <div className="text-primary-foreground/70 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
