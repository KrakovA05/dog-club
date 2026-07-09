import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Ticket, ArrowRight } from "lucide-react";
import {
  SUBSCRIPTION_PLANS,
  effectiveSubscriptionStatus,
  type Subscription,
  type SubscriptionVisit,
  type SubscriptionType,
} from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Мои абонементы — Личный кабинет" };
// Кэш запрещён на уровне (cabinet)/layout (force-dynamic) и next.config
// (private, no-store для /cabinet) — страница с ПДн.

type SubRow = Subscription & {
  subscription_visits: SubscriptionVisit[];
  pets: { name: string; type: string } | null;
};

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export default async function CabinetSubscriptionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Явный фильтр по владельцу ОБЯЗАТЕЛЕН: RLS для staff/admin отдаёт ВСЕ
  // абонементы (нужно админке), и без .eq() у админа в личном кабинете
  // вылезали чужие. Правило кабинета: не полагаться на RLS, всегда .eq(owner).
  const { data } = await supabase
    .from("subscriptions")
    .select("*, subscription_visits(*), pets(name, type)")
    .eq("user_id", user.id)
    .order("purchased_at", { ascending: false });

  const subs = (data ?? []) as unknown as SubRow[];
  const active = subs.filter((s) => {
    const st = effectiveSubscriptionStatus(s);
    return st === "active" || st === "frozen";
  });
  const past = subs.filter((s) => !active.includes(s));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Мои абонементы</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Абонементы детского сада — посещения отмечает администратор при визите
        </p>
      </div>

      {subs.length === 0 && (
        <div className="rounded-2xl border p-8 text-center space-y-3">
          <Ticket className="h-10 w-10 text-primary/40 mx-auto" />
          <h2 className="font-semibold text-lg">У вас пока нет абонементов</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Абонемент выгоднее разовых посещений: от 960 ₽ за посещение вместо
            1 200 ₽. Оформить можно у администратора — очно или по телефону.
          </p>
          <Link
            href="/prices"
            className="inline-flex items-center gap-1.5 text-primary font-medium text-sm hover:underline"
          >
            Посмотреть цены <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {active.map((s) => <SubscriptionCard key={s.id} sub={s} muted={false} />)}

      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Завершённые
          </h2>
          {past.map((s) => <SubscriptionCard key={s.id} sub={s} muted />)}
        </div>
      )}
    </div>
  );
}

function SubscriptionCard({ sub, muted }: { sub: SubRow; muted: boolean }) {
  const st = effectiveSubscriptionStatus(sub);
  const used = sub.subscription_visits.length;
  const left = Math.max(0, sub.total_visits - used);
  const pct = Math.min(100, Math.round((used / sub.total_visits) * 100));
  const plan = SUBSCRIPTION_PLANS[sub.type as SubscriptionType];
  const visits = [...sub.subscription_visits].sort((a, b) => a.visit_date.localeCompare(b.visit_date));

  const statusText =
    st === "frozen" ? "Заморожен" :
    st === "expired" ? "Срок истёк" :
    st === "used_up" ? "Использован полностью" : null;

  return (
    <div className={`rounded-2xl border p-6 space-y-4 ${muted ? "opacity-60" : "bg-card"}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="font-semibold text-lg flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            Абонемент · {plan?.label ?? sub.type}
            {sub.pets && (
              <span className="text-sm font-normal text-muted-foreground">
                {sub.pets.type === "dog" ? "🐶" : "🐱"} {sub.pets.name}
              </span>
            )}
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">
            действует до {fmtDate(sub.expires_at)}
            {statusText && <span className="ml-2">· {statusText}</span>}
          </div>
        </div>
        {st === "active" && (
          <div className="text-right">
            <div className="text-3xl font-bold text-primary leading-none">{left}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {left === 1 ? "посещение осталось" : "посещений осталось"}
            </div>
          </div>
        )}
      </div>

      {/* Крупный прогресс */}
      <div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-sm text-muted-foreground mt-1.5">
          Использовано {used} из {sub.total_visits}
        </div>
      </div>

      {/* История посещений */}
      {visits.length > 0 && (
        <div>
          <div className="text-sm font-medium mb-1.5">История посещений</div>
          <div className="flex flex-wrap gap-1.5">
            {visits.map((v) => (
              <span key={v.id} className="text-xs bg-muted rounded-full px-2.5 py-1">
                {new Date(v.visit_date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
