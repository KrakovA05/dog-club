import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { BlogEditor } from "@/components/admin/BlogEditor";
import type { BlogPost } from "@/types";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase.from("blog_posts").select("*").eq("id", id).single();
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Редактировать статью</h1>
      <BlogEditor post={post as BlogPost} />
    </div>
  );
}
