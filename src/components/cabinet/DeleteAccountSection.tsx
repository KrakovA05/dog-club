"use client";
import { useState } from "react";
import { deleteAccount } from "@/lib/account-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TriangleAlert } from "lucide-react";

const CONFIRM_WORD = "УДАЛИТЬ";

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmed = confirmText.trim().toUpperCase() === CONFIRM_WORD;

  async function onDelete() {
    if (!confirmed || busy) return;
    setBusy(true);
    setError(null);
    const result = await deleteAccount();
    if (!result.success) {
      setError(result.error);
      setBusy(false);
      return;
    }
    setDone(true);
    // Даём прочитать сообщение и уводим на главную (сессии уже нет)
    setTimeout(() => window.location.assign("/"), 2000);
  }

  return (
    <>
      {/* Опасная зона */}
      <div className="rounded-xl border border-destructive/30 p-6 space-y-3">
        <h2 className="font-semibold text-destructive flex items-center gap-2">
          <TriangleAlert className="h-4 w-4" />
          Опасная зона
        </h2>
        <p className="text-sm text-muted-foreground">
          Удаление аккаунта необратимо: профиль, питомцы и фото ветпаспортов
          будут удалены. Записи о прошлых бронированиях обезличиваются и
          хранятся 3 года согласно политике конфиденциальности.
        </p>
        <Button
          variant="destructive"
          onClick={() => { setOpen(true); setConfirmText(""); setError(null); }}
        >
          Удалить аккаунт
        </Button>
      </div>

      {/* Модалка подтверждения */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"
          onClick={() => !busy && !done && setOpen(false)}
        >
          <div
            className="bg-card rounded-2xl shadow-lg max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">👋</div>
                <h3 className="font-semibold text-lg mb-1">Аккаунт удалён</h3>
                <p className="text-muted-foreground text-sm">
                  Спасибо, что были с нами. Сейчас перенаправим на главную…
                </p>
              </div>
            ) : (
              <>
                <h3 className="font-semibold text-lg text-destructive">
                  Удалить аккаунт навсегда?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Это действие <strong className="text-foreground">необратимо</strong>.
                  Будут удалены: аккаунт, профиль, питомцы, фото ветпаспортов.
                  Восстановить данные будет невозможно.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-delete">
                    Введите <strong>{CONFIRM_WORD}</strong>, чтобы подтвердить
                  </Label>
                  <Input
                    id="confirm-delete"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={CONFIRM_WORD}
                    autoComplete="off"
                  />
                </div>
                {error && (
                  <p className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
                )}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
                    Отмена
                  </Button>
                  <Button variant="destructive" onClick={onDelete} disabled={!confirmed || busy}>
                    {busy ? "Удаляем…" : "Удалить аккаунт"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
