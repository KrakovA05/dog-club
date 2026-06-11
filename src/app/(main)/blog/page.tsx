import type { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { BlogPost } from "@/types";

export const metadata: Metadata = {
  title: "Блог о собаках и кошках — советы по уходу за питомцами",
  description: "Полезные статьи о уходе за собаками и кошками: кормление, здоровье, воспитание, подготовка к передержке. От команды зоогостиницы Лапа Клуб в Калуге.",
  keywords: ["уход за собаками советы", "уход за кошками", "передержка животных советы", "блог о питомцах"],
  alternates: { canonical: "https://lapaclub.ru/blog" },
  openGraph: {
    title: "Блог о собаках и кошках — советы по уходу за питомцами",
    description: "Полезные статьи об уходе за собаками и кошками от команды зоогостиницы Лапа Клуб в Калуге.",
    url: "https://lapaclub.ru/blog",
  },
};

export const revalidate = 1800;

export default async function BlogPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, cover_url, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  return (
    <>
      <section className="bg-brand-light py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Блог</h1>
          <p className="text-muted-foreground text-lg">Советы по уходу и воспитанию питомцев</p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          {!posts?.length ? (
            <p className="text-center text-muted-foreground py-20">Статьи скоро появятся</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(posts as Partial<BlogPost>[]).map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow h-full">
                    {post.cover_url && (
                      <div className="aspect-video rounded-t-lg overflow-hidden bg-muted relative">
                        <Image src={post.cover_url} alt={post.title ?? ""} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
                      </div>
                    )}
                    <CardContent className="pt-5 pb-5">
                      <h2 className="font-semibold text-lg mb-2 line-clamp-2">{post.title}</h2>
                      {post.excerpt && (
                        <p className="text-muted-foreground text-sm line-clamp-3">{post.excerpt}</p>
                      )}
                      {post.published_at && (
                        <p className="text-xs text-muted-foreground mt-3">
                          {new Date(post.published_at).toLocaleDateString("ru-RU")}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
