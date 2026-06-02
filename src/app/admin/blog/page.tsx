import { createAdminClient as createClient } from "@/lib/supabase/admin";
import { deleteBlogPost } from "@/lib/admin-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { BlogPost } from "@/types";

export default async function AdminBlogPage() {
  const supabase = createClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, title, slug, is_published, published_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Блог</h1>
        <Button size="sm" render={<Link href="/admin/blog/new"><Plus className="h-4 w-4 mr-1" /> Новая статья</Link>} />
      </div>

      {!posts?.length ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          Статей пока нет
        </div>
      ) : (
        <div className="space-y-2">
          {(posts as Partial<BlogPost>[]).map((p) => (
            <div key={p.id} className="bg-background rounded-xl border px-5 py-4 flex justify-between items-center gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{p.title}</span>
                  <Badge variant={p.is_published ? "default" : "secondary"} className="text-xs shrink-0">
                    {p.is_published ? "Опубликовано" : "Черновик"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">/{p.slug}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" render={<Link href={`/admin/blog/${p.id}`}>Редактировать</Link>} />
                <form action={deleteBlogPost.bind(null, p.id!)}>
                  <Button type="submit" size="sm" variant="outline"
                    className="text-destructive hover:text-destructive border-destructive/30">
                    Удалить
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
