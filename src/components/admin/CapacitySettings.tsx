"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCapacity } from "@/lib/admin-actions";
import type { CapacityZoneRow } from "@/types";

export function CapacitySettings({ zones }: { zones: CapacityZoneRow[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(zones.map((z) => [z.zone, String(z.capacity)]))
  );
  const [savingZone, setSavingZone] = useState<string | null>(null);
  const [savedZone, setSavedZone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(zone: string) {
    const n = Number(values[zone]);
    if (!Number.isInteger(n) || n < 0) { setError("Введите целое число ≥ 0"); return; }
    setSavingZone(zone);
    setError(null);
    setSavedZone(null);
    try {
      await updateCapacity(zone, n);
      setSavedZone(zone);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setSavingZone(null);
    }
  }

  return (
    <div className="space-y-3 max-w-xl">
      {zones.map((z) => (
        <div key={z.zone} className="bg-background rounded-xl border p-4 flex items-center justify-between gap-4">
          <div>
            <div className="font-medium text-sm">{z.label}</div>
            <div className="text-xs text-muted-foreground">Максимум животных одновременно</div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={values[z.zone] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [z.zone]: e.target.value }))}
              className="w-20 h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="button"
              onClick={() => save(z.zone)}
              disabled={savingZone === z.zone}
              className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {savingZone === z.zone ? "..." : savedZone === z.zone ? "Сохранено" : "Сохранить"}
            </button>
          </div>
        </div>
      ))}
      {error && (
        <p className="text-sm bg-destructive/10 text-destructive px-3 py-2 rounded-lg">{error}</p>
      )}
    </div>
  );
}
