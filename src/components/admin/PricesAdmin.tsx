"use client";
import { useState } from "react";
import { upsertPrice, deletePrice } from "@/lib/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import type { PriceRow } from "@/types";

export function PricesAdmin({
  prices,
  serviceType,
}: {
  prices: PriceRow[];
  serviceType: "daycare" | "hotel";
}) {
  const [editing, setEditing] = useState<Partial<PriceRow> | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!editing || saving) return;
    setSaving(true);
    try {
      await upsertPrice({
        id: editing.id,
        service_type: serviceType,
        label: editing.label ?? "",
        description: editing.description ?? "",
        price: editing.price ?? 0,
        unit: editing.unit ?? (serviceType === "hotel" ? "сутки" : "день"),
        is_featured: editing.is_featured ?? false,
        sort_order: editing.sort_order ?? prices.length,
      });
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  const defaultUnit = serviceType === "hotel" ? "сутки" : "день";

  return (
    <div className="space-y-4">
      <div className="rounded-xl border overflow-hidden bg-background">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Название</th>
              <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Описание</th>
              <th className="text-right px-4 py-3 font-medium">Цена</th>
              <th className="text-center px-4 py-3 font-medium">Хит</th>
              <th className="px-4 py-3 w-20" />
            </tr>
          </thead>
          <tbody>
            {prices.map((p) =>
              editing?.id === p.id ? (
                <tr key={p.id} className="border-t bg-brand-light">
                  <td className="px-4 py-2">
                    <Input
                      value={editing.label ?? ""}
                      onChange={(e) => setEditing((prev) => ({ ...prev, label: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2 hidden sm:table-cell">
                    <Input
                      value={editing.description ?? ""}
                      onChange={(e) => setEditing((prev) => ({ ...prev, description: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1 justify-end">
                      <Input
                        type="number"
                        value={editing.price ?? ""}
                        onChange={(e) => setEditing((prev) => ({ ...prev, price: Number(e.target.value) }))}
                        className="h-8 text-sm w-24"
                      />
                      <Input
                        value={editing.unit ?? ""}
                        onChange={(e) => setEditing((prev) => ({ ...prev, unit: e.target.value }))}
                        className="h-8 text-sm w-20"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={editing.is_featured ?? false}
                      onChange={(e) => setEditing((prev) => ({ ...prev, is_featured: e.target.checked }))}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1 justify-end">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={save} disabled={saving}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={p.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{p.label}</td>
                  <td className="px-4 py-3 text-muted-foreground text-sm hidden sm:table-cell">
                    {p.description}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-primary">
                    {p.price.toLocaleString("ru-RU")} ₽
                    <span className="text-xs font-normal text-muted-foreground ml-1">/{p.unit}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-primary">{p.is_featured ? "✓" : ""}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <form action={deletePrice.bind(null, p.id)}>
                        <Button size="icon" variant="ghost" type="submit"
                          className="h-7 w-7 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {editing && !editing.id ? (
        <div className="rounded-xl border p-5 bg-background space-y-3">
          <h3 className="font-semibold text-sm">Новая позиция</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input placeholder="Название" value={editing.label ?? ""}
              onChange={(e) => setEditing((p) => ({ ...p, label: e.target.value }))} />
            <Input placeholder="Описание" value={editing.description ?? ""}
              onChange={(e) => setEditing((p) => ({ ...p, description: e.target.value }))} />
            <Input type="number" placeholder="Цена (₽)" value={editing.price ?? ""}
              onChange={(e) => setEditing((p) => ({ ...p, price: Number(e.target.value) }))} />
            <Input placeholder={`Единица (${defaultUnit})`} value={editing.unit ?? ""}
              onChange={(e) => setEditing((p) => ({ ...p, unit: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "Сохраняем..." : "Добавить"}</Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Отмена</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm"
          onClick={() => setEditing({ label: "", description: "", price: 0, unit: defaultUnit, is_featured: false, sort_order: prices.length })}>
          <Plus className="h-4 w-4 mr-1" /> Добавить позицию
        </Button>
      )}
    </div>
  );
}
