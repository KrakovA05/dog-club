import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { BlogPost } from "@/types";

export async function BlogTeaser() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, cover_url, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(2);

  if (!posts?.length) return null;

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Советы от нас</h2>
            <p className="text-muted-foreground">Полезные статьи об уходе за питомцами</p>
          </div>
          <Button variant="outline" render={<Link href="/blog">Все статьи <ArrowRight className="h-4 w-4" /></Link>} className="hidden sm:flex" />
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {(posts as Partial<BlogPost>[]).map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 h-full">
                {post.cover_url && (
                  <div className="aspect-video rounded-t-lg overflow-hidden bg-muted relative">
                    <Image src={post.cover_url} alt={post.title ?? ""} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
                  </div>
                )}
                <CardContent className="pt-5 pb-5">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{post.title}</h3>
                  {post.excerpt && (
                    <p className="text-muted-foreground text-sm line-clamp-2">{post.excerpt}</p>
                  )}
                  <p className="text-xs text-primary font-medium mt-3 flex items-center gap-1">
                    Читать статью <ArrowRight className="h-3 w-3" />
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8 sm:hidden">
          <Button variant="outline" render={<Link href="/blog">Все статьи</Link>} />
        </div>
      </div>
    </section>
  );
}
