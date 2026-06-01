"use client";
import { useState } from "react";
import { upsertFaq, deleteFaq } from "@/lib/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import type { FaqRow } from "@/types";

export function FaqAdmin({ faqs }: { faqs: FaqRow[] }) {
  const [editing, setEditing] = useState<Partial<FaqRow> | null>(null);

  async function save() {
    if (!editing) return;
    await upsertFaq({
      id: editing.id,
      question: editing.question ?? "",
      answer: editing.answer ?? "",
      sort_order: editing.sort_order ?? faqs.length + 1,
    });
    setEditing(null);
  }

  return (
    <div className="space-y-3">
      {faqs.map((f) =>
        editing?.id === f.id ? (
          <div key={f.id} className="rounded-xl border p-4 bg-brand-light space-y-3">
            <Input
              value={editing.question ?? ""}
              onChange={(e) => setEditing((p) => ({ ...p, question: e.target.value }))}
              placeholder="Вопрос"
            />
            <textarea
              value={editing.answer ?? ""}
              onChange={(e) => setEditing((p) => ({ ...p, answer: e.target.value }))}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              rows={3}
              placeholder="Ответ"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={save}>
                <Check className="h-4 w-4 mr-1" /> Сохранить
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div key={f.id} className="rounded-xl border p-4 bg-background flex justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm mb-1">{f.question}</div>
              <div className="text-sm text-muted-foreground line-clamp-2">{f.answer}</div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(f)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <form action={deleteFaq.bind(null, f.id)}>
                <Button size="icon" variant="ghost" type="submit"
                  className="h-8 w-8 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        )
      )}

      {editing && !editing.id ? (
        <div className="rounded-xl border p-4 bg-background space-y-3">
          <Input
            value={editing.question ?? ""}
            onChange={(e) => setEditing((p) => ({ ...p, question: e.target.value }))}
            placeholder="Новый вопрос"
          />
          <textarea
            value={editing.answer ?? ""}
            onChange={(e) => setEditing((p) => ({ ...p, answer: e.target.value }))}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            rows={3}
            placeholder="Ответ"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={save}>Добавить</Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Отмена</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm"
          onClick={() => setEditing({ question: "", answer: "" })}>
          <Plus className="h-4 w-4 mr-1" /> Добавить вопрос
        </Button>
      )}
    </div>
  );
}
