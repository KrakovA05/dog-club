"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertBlogPost } from "@/lib/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BlogPost } from "@/types";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

function slugify(str: string) {
  const map: Record<string, string> = {
    а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",и:"i",й:"j",
    к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",
    х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya",
  };
  return str
    .toLowerCase()
    .replace(/[а-яёА-ЯЁ]/g, (c) => map[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function BlogEditor({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [coverUrl, setCoverUrl] = useState(post?.cover_url ?? "");
  const [published, setPublished] = useState(post?.is_published ?? false);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    await upsertBlogPost({
      id: post?.id,
      slug: slug || slugify(title),
      title,
      excerpt,
      content,
      cover_url: coverUrl,
      is_published: published,
    });
    setSaving(false);
    router.push("/admin/blog");
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Заголовок *</Label>
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!post) setSlug(slugify(e.target.value));
            }}
            placeholder="Как подготовить собаку к первому посещению сада"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Slug (URL)</Label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto-from-title"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Краткое описание (для превью)</Label>
        <Input
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="2-3 предложения"
        />
      </div>

      <div className="space-y-1.5">
        <Label>URL обложки</Label>
        <Input
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-1.5" data-color-mode="light">
        <Label>Текст статьи (Markdown) *</Label>
        <MDEditor value={content} onChange={(v) => setContent(v ?? "")} height={400} />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="published"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="w-4 h-4 accent-primary"
        />
        <Label htmlFor="published" className="cursor-pointer">Опубликовать сразу</Label>
      </div>

      <div className="flex gap-3">
        <Button onClick={save} disabled={saving || !title.trim()}>
          {saving ? "Сохраняем..." : post ? "Сохранить изменения" : "Создать статью"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/admin/blog")}>Отмена</Button>
      </div>
    </div>
  );
}
