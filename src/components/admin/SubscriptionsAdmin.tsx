"use client";
import { useMemo, useState } from "react";
import {
  createSubscription,
  markVisit,
  unmarkVisit,
  freezeSubscription,
  unfreezeSubscription,
  updateSubscriptionNotes,
} from "@/lib/subscription-actions";
import {
  SUBSCRIPTION_PLANS,
  effectiveSubscriptionStatus,
  type Subscription,
  type SubscriptionVisit,
  type SubscriptionStatus,
  type SubscriptionType,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { CheckCircle2, ChevronDown, Plus, Snowflake, PartyPopper } from "lucide-react";

type SubRow = Subscription & {
  subscription_visits: SubscriptionVisit[];
  profiles: { full_name: string | null; phone: string | null } | null;
  pets: { name: string; type: string } | null;
};
type Client = { id: string; full_name: string | null; phone: string | null };
type PetOption = { id: string; owner_id: string; name: string; type: string };
type Staff = { id: string; full_name: string | null };

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: "Активен",
  frozen: "Заморожен",
  expired: "Истёк",
  used_up: "Использован",
};

const STATUS_CLASS: Record<SubscriptionStatus, string> = {
  active: "bg-green-100 text-green-800",
  frozen: "bg-sky-100 text-sky-800",
  expired: "bg-amber-100 text-amber-800",
  used_up: "bg-muted text-muted-foreground",
};

type Filter = "active" | "expired" | "used_up" | "all";

function todayStr(): string {
  return new Date().toLocaleDateString("sv", { timeZone: "Europe/Moscow" });
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

function daysLeft(expiresAt: string): number {
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
}

export function SubscriptionsAdmin({
  subscriptions,
  clients,
  pets,
  staff,
}: {
  subscriptions: SubRow[];
  clients: Client[];
  pets: PetOption[];
  staff: Staff[];
}) {
  const [filter, setFilter] = useState<Filter>("active");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Модалка отметки посещения
  const [marking, setMarking] = useState<SubRow | null>(null);
  const [visitDate, setVisitDate] = useState(todayStr());
  const [confirmDouble, setConfirmDouble] = useState(false);
  const [congrats, setCongrats] = useState(false);

  const staffNames = useMemo(
    () => Object.fromEntries(staff.map((s) => [s.id, s.full_name ?? "администратор"])),
    [staff]
  );

  const filtered = subscriptions.filter((s) => {
    const st = effectiveSubscriptionStatus(s);
    if (filter === "all") return true;
    if (filter === "active") return st === "active" || st === "frozen";
    return st === filter;
  });

  function ownerLabel(s: SubRow): string {
    if (s.profiles?.full_name) return s.profiles.full_name;
    if (s.guest_name) return `${s.guest_name} (гость)`;
    return "—";
  }

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function onMark() {
    if (!marking) return;
    const already = marking.subscription_visits.some((v) => v.visit_date === visitDate);
    if (already && !confirmDouble) {
      setConfirmDouble(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await markVisit(marking.id, visitDate);
      if (res.usedUp) {
        setCongrats(true); // поздравительное состояние, модалку закроет кнопка
      } else {
        closeMarkModal();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  function closeMarkModal() {
    setMarking(null);
    setVisitDate(todayStr());
    setConfirmDouble(false);
    setCongrats(false);
    setError(null);
  }

  return (
    <div className="space-y-4">
      {/* Панель: фильтры + добавить */}
      <div className="flex flex-wrap items-center gap-2">
        {([
          ["active", "Активные"],
          ["expired", "Истёкшие"],
          ["used_up", "Использованные"],
          ["all", "Все"],
        ] as [Filter, string][]).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === value ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"
            }`}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <RefreshButton />
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4 mr-1" /> Абонемент
          </Button>
        </div>
      </div>

      {error && !marking && (
        <p className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
      )}

      {showForm && (
        <NewSubscriptionForm
          clients={clients}
          pets={pets}
          onDone={() => setShowForm(false)}
        />
      )}

      {/* Список */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border p-10 text-center text-muted-foreground text-sm">
          Абонементов в этом фильтре нет
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const st = effectiveSubscriptionStatus(s);
            const used = s.subscription_visits.length;
            const pct = Math.min(100, Math.round((used / s.total_visits) * 100));
            const dl = daysLeft(s.expires_at);
            const isOpen = expanded === s.id;
            const canMark = st === "active";

            return (
              <div key={s.id} className="rounded-xl border bg-card">
                <div className="p-4 flex flex-wrap items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{ownerLabel(s)}</span>
                      {s.pets && (
                        <span className="text-sm text-muted-foreground">
                          {s.pets.type === "dog" ? "🐶" : "🐱"} {s.pets.name}
                        </span>
                      )}
                      <Badge className={`text-xs ${STATUS_CLASS[st]}`}>{STATUS_LABEL[st]}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {SUBSCRIPTION_PLANS[s.type as SubscriptionType]?.label ?? s.type} ·{" "}
                      {s.price.toLocaleString("ru-RU")} ₽ · до {fmtDate(s.expires_at)}
                      {st === "active" && dl >= 0 && ` (${dl} дн.)`}
                    </div>
                    {/* Прогресс */}
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-2 rounded-full bg-muted flex-1 max-w-52 overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-medium whitespace-nowrap">
                        {used} из {s.total_visits}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canMark && (
                      <Button onClick={() => { setMarking(s); setVisitDate(todayStr()); }}>
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        Отметить посещение
                      </Button>
                    )}
                    <button
                      onClick={() => setExpanded(isOpen ? null : s.id)}
                      className="p-2 rounded-lg hover:bg-accent transition-colors"
                      aria-label="Подробности"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <SubscriptionDetails
                    sub={s}
                    status={st}
                    staffNames={staffNames}
                    busy={busy}
                    run={run}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Модалка отметки */}
      {marking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"
          onClick={() => !busy && closeMarkModal()}>
          <div className="bg-card rounded-2xl shadow-lg max-w-sm w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}>
            {congrats ? (
              <div className="text-center py-2">
                <PartyPopper className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-1">Абонемент использован полностью!</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Все {marking.total_visits} посещений отмечены. Самое время предложить клиенту новый 🎉
                </p>
                <Button className="w-full" onClick={closeMarkModal}>Отлично</Button>
              </div>
            ) : (
              <>
                <h3 className="font-semibold text-lg">Отметить посещение</h3>
                <p className="text-sm text-muted-foreground">
                  {ownerLabel(marking)} · {marking.subscription_visits.length + 1}-е из {marking.total_visits}
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="visit-date">Дата посещения</Label>
                  <Input id="visit-date" type="date" value={visitDate}
                    onChange={(e) => { setVisitDate(e.target.value); setConfirmDouble(false); }} />
                </div>
                {confirmDouble && (
                  <p className="text-sm bg-amber-50 text-amber-900 px-3 py-2 rounded-lg">
                    ⚠️ На эту дату уже есть отметка. Точно отметить ещё раз?
                    (Например, если посещали два питомца.)
                  </p>
                )}
                {error && <p className="text-destructive text-sm">{error}</p>}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={closeMarkModal} disabled={busy}>Отмена</Button>
                  <Button onClick={onMark} disabled={busy || !visitDate}>
                    {busy ? "Отмечаем…" : confirmDouble ? "Да, отметить" : "Отметить"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Развёрнутая карточка: журнал, заморозка, notes ──────────────────────────
function SubscriptionDetails({
  sub,
  status,
  staffNames,
  busy,
  run,
}: {
  sub: SubRow;
  status: SubscriptionStatus;
  staffNames: Record<string, string>;
  busy: boolean;
  run: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const [confirmUnmark, setConfirmUnmark] = useState<string | null>(null);
  const [notes, setNotes] = useState(sub.notes ?? "");
  const visits = [...sub.subscription_visits].sort((a, b) => a.visit_date.localeCompare(b.visit_date));

  return (
    <div className="border-t px-4 py-4 space-y-4 bg-muted/20 rounded-b-xl">
      {/* Журнал посещений */}
      <div>
        <div className="text-sm font-medium mb-2">Журнал посещений</div>
        {visits.length === 0 ? (
          <p className="text-sm text-muted-foreground">Посещений ещё не было</p>
        ) : (
          <ul className="space-y-1.5">
            {visits.map((v, i) => (
              <li key={v.id} className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground w-6">{i + 1}.</span>
                <span className="font-medium">{fmtDate(v.visit_date)}</span>
                <span className="text-xs text-muted-foreground">
                  отметил(а) {v.marked_by ? staffNames[v.marked_by] ?? "администратор" : "—"}
                </span>
                {confirmUnmark === v.id ? (
                  <span className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-destructive">Удалить отметку?</span>
                    <Button size="sm" variant="destructive" disabled={busy}
                      onClick={() => run(() => unmarkVisit(v.id)).then(() => setConfirmUnmark(null))}>
                      Да
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setConfirmUnmark(null)}>Нет</Button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirmUnmark(v.id)}
                    className="ml-auto text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    отменить
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Заморозка */}
      <div className="flex items-center gap-3">
        {status === "active" && (
          <Button size="sm" variant="outline" disabled={busy}
            onClick={() => run(() => freezeSubscription(sub.id))}>
            <Snowflake className="h-4 w-4 mr-1.5" /> Заморозить
          </Button>
        )}
        {status === "frozen" && (
          <>
            <Button size="sm" disabled={busy} onClick={() => run(() => unfreezeSubscription(sub.id))}>
              Разморозить
            </Button>
            <span className="text-xs text-muted-foreground">
              заморожен {sub.frozen_at ? fmtDate(sub.frozen_at) : ""} — срок продлится на время заморозки
            </span>
          </>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          куплен {fmtDate(sub.purchased_at)}
          {sub.guest_phone ? ` · ${sub.guest_phone}` : ""}
        </span>
      </div>

      {/* Заметки */}
      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-1">
          <Label htmlFor={`notes-${sub.id}`} className="text-xs">Заметки</Label>
          <Input id={`notes-${sub.id}`} value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Например: оплачено переводом 05.07" />
        </div>
        <Button size="sm" variant="outline" disabled={busy || notes === (sub.notes ?? "")}
          onClick={() => run(() => updateSubscriptionNotes(sub.id, notes))}>
          Сохранить
        </Button>
      </div>
    </div>
  );
}

// ─── Форма «+ Абонемент» ─────────────────────────────────────────────────────
function NewSubscriptionForm({
  clients,
  pets,
  onDone,
}: {
  clients: Client[];
  pets: PetOption[];
  onDone: () => void;
}) {
  const [mode, setMode] = useState<"registered" | "guest">("registered");
  const [search, setSearch] = useState("");
  const [clientId, setClientId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [consentReceived, setConsentReceived] = useState(false);
  const [type, setType] = useState<SubscriptionType>("visits_6");
  const [petId, setPetId] = useState("");
  const [purchasedAt, setPurchasedAt] = useState(todayStr());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const found = search.trim().length > 0
    ? clients.filter((c) =>
        (c.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (c.phone ?? "").includes(search)
      ).slice(0, 8)
    : [];
  const selectedClient = clients.find((c) => c.id === clientId);
  const clientPets = mode === "registered" && clientId ? pets.filter((p) => p.owner_id === clientId) : [];
  const plan = SUBSCRIPTION_PLANS[type];

  async function save() {
    setError(null);
    if (mode === "registered" && !clientId) { setError("Выберите клиента"); return; }
    if (mode === "guest" && (!guestName.trim() || !guestPhone.trim())) {
      setError("Укажите имя и телефон гостя"); return;
    }
    if (mode === "guest" && !consentReceived) {
      setError("Отметьте, что клиент дал согласие на обработку персональных данных"); return;
    }
    setSaving(true);
    try {
      await createSubscription({
        type,
        pet_id: petId || null,
        purchased_at: purchasedAt || null,
        notes: notes.trim() || null,
        ...(mode === "registered"
          ? { mode: "registered" as const, user_id: clientId }
          : { mode: "guest" as const, guest_name: guestName, guest_phone: guestPhone, consentReceived }),
      });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border p-5 space-y-4 bg-card">
      <div className="font-semibold">Новый абонемент</div>

      {/* Режим: клиент / гость */}
      <div className="grid grid-cols-2 gap-3 max-w-md">
        {([["registered", "Зарегистрированный"], ["guest", "Гость (без аккаунта)"]] as const).map(([v, label]) => (
          <label key={v} className="cursor-pointer">
            <input type="radio" name="sub-mode" checked={mode === v} onChange={() => setMode(v)} className="sr-only peer" />
            <div className="rounded-xl border-2 p-3 text-center peer-checked:border-primary peer-checked:bg-brand-light transition-all text-sm font-medium">
              {label}
            </div>
          </label>
        ))}
      </div>

      {mode === "registered" ? (
        <div className="space-y-2 max-w-md">
          <Label>Клиент *</Label>
          {selectedClient ? (
            <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              <span>{selectedClient.full_name ?? "Без имени"}{selectedClient.phone ? ` · ${selectedClient.phone}` : ""}</span>
              <button className="text-xs text-primary hover:underline" onClick={() => { setClientId(""); setSearch(""); }}>
                изменить
              </button>
            </div>
          ) : (
            <>
              <Input placeholder="Поиск по имени или телефону…" value={search} onChange={(e) => setSearch(e.target.value)} />
              {found.length > 0 && (
                <div className="rounded-lg border divide-y">
                  {found.map((c) => (
                    <button key={c.id} className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                      onClick={() => { setClientId(c.id); setPetId(""); }}>
                      {c.full_name ?? "Без имени"}{c.phone ? ` · ${c.phone}` : ""}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          {clientPets.length > 0 && (
            <div className="space-y-1.5">
              <Label>Питомец (необязательно)</Label>
              <select value={petId} onChange={(e) => setPetId(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm bg-background">
                <option value="">Любой питомец владельца</option>
                {clientPets.map((p) => (
                  <option key={p.id} value={p.id}>{p.type === "dog" ? "🐶" : "🐱"} {p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3 max-w-md">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Имя гостя *</Label>
              <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Иван" />
            </div>
            <div className="space-y-1.5">
              <Label>Телефон *</Label>
              <Input type="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="+7 900 000 00 00" />
            </div>
          </div>
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={consentReceived} onChange={(e) => setConsentReceived(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-primary cursor-pointer" />
            <span className="text-sm leading-snug">
              Клиент дал согласие на обработку персональных данных{" "}
              <span className="text-muted-foreground">(обязательно; фиксируется в заметках)</span>
            </span>
          </label>
        </div>
      )}

      {/* Тип */}
      <div className="grid grid-cols-2 gap-3 max-w-md">
        {(Object.entries(SUBSCRIPTION_PLANS) as [SubscriptionType, typeof plan][]).map(([v, p]) => (
          <label key={v} className="cursor-pointer">
            <input type="radio" name="sub-type" checked={type === v} onChange={() => setType(v)} className="sr-only peer" />
            <div className="rounded-xl border-2 p-3 peer-checked:border-primary peer-checked:bg-brand-light transition-all">
              <div className="text-sm font-medium">{p.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {p.price.toLocaleString("ru-RU")} ₽ · {p.durationDays} дней
              </div>
            </div>
          </label>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3 max-w-md">
        <div className="space-y-1.5">
          <Label>Дата покупки</Label>
          <Input type="date" value={purchasedAt} onChange={(e) => setPurchasedAt(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Заметка</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Оплата наличными…" />
        </div>
      </div>

      {error && <p className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}

      <div className="flex gap-2">
        <Button onClick={save} disabled={saving}>
          {saving ? "Сохраняем…" : `Оформить за ${plan.price.toLocaleString("ru-RU")} ₽`}
        </Button>
        <Button variant="outline" onClick={onDone} disabled={saving}>Отмена</Button>
      </div>
    </div>
  );
}
