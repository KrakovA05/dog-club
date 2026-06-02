"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { translateSupabaseError } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError("Минимум 6 символов"); return; }
    if (password !== confirm) { setError("Пароли не совпадают"); return; }

    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) { setError(translateSupabaseError(updateError.message)); return; }
    router.push("/cabinet");
  }

  return (
    <div className="bg-card rounded-2xl shadow-sm p-8">
      <h1 className="text-2xl font-bold mb-1">Новый пароль</h1>
      <p className="text-muted-foreground text-sm mb-6">Придумайте новый пароль для входа</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">Новый пароль</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Повторите пароль</Label>
          <Input
            id="confirm"
            type="password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Сохраняем..." : "Сохранить пароль"}
        </Button>
      </form>
    </div>
  );
}
