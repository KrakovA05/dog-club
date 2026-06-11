"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronDown, Loader2 } from "lucide-react";

interface GeneratedPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
}

interface Props {
  onGenerated: (post: GeneratedPost) => void;
}

export function GeneratePostModal({ onGenerated }: Props) {
  const [open, setOpen] = useState(false);
  const [topics, setTopics] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && topics.length === 0) {
      fetch("/api/admin/generate-post")
        .then((r) => r.json())
        .then((d) => setTopics(d.topics ?? []));
    }
  }, [open, topics.length]);

  async function generate() {
    const topic = custom.trim() || selected;
    if (!topic) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/generate-post", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Ошибка генерации"); return; }
      onGenerated(data as GeneratedPost);
      setOpen(false);
      setSelected("");
      setCustom("");
    } catch {
      setError("Не удалось подключиться к серверу");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
        <Sparkles className="h-4 w-4" />
        Сгенерировать с ИИ
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Сгенерировать статью</h2>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Выберите тему</label>
              <div className="relative">
                <select
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm appearance-none pr-8"
                  value={selected}
                  onChange={(e) => { setSelected(e.target.value); setCustom(""); }}
                >
                  <option value="">— выбрать из списка —</option>
                  {topics.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex-1 h-px bg-border" />или своя тема<div className="flex-1 h-px bg-border" />
              </div>

              <input
                type="text"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="Например: как выбрать корм для пожилой собаки"
                value={custom}
                onChange={(e) => { setCustom(e.target.value); setSelected(""); }}
              />
            </div>

            {error && <p className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Пишем статью... обычно 15–30 секунд
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Отмена</Button>
              <Button onClick={generate} disabled={loading || (!selected && !custom.trim())} className="gap-1.5">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Генерируем..." : "Написать статью"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
