import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { CtaBanner } from "@/components/sections/CtaBanner";
import type { BlogPost } from "@/types";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("title, excerpt")
    .eq("slug", slug)
    .single();

  if (!post) return { title: "Статья не найдена" };
  return { title: post.title, description: post.excerpt ?? undefined };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!post) notFound();

  const p = post as BlogPost;

  return (
    <>
      <article className="py-12 md:py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{p.title}</h1>
            {p.published_at && (
              <time className="text-muted-foreground text-sm">
                {new Date(p.published_at).toLocaleDateString("ru-RU", {
                  year: "numeric", month: "long", day: "numeric",
                })}
              </time>
            )}
          </header>

          {p.cover_url && (
            <div className="aspect-video rounded-2xl overflow-hidden mb-8 bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.cover_url} alt={p.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="prose prose-neutral max-w-none">
            <ReactMarkdown>{p.content}</ReactMarkdown>
          </div>
        </div>
      </article>
      <CtaBanner />
    </>
  );
}
