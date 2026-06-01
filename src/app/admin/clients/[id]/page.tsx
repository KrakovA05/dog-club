import { createAdminClient as createClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function AdminClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();

  const [{ data: profile }, { data: pets }, { data: bookings }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single(),
    supabase.from("pets").select("*").eq("owner_id", id).order("created_at"),
    supabase
      .from("bookings")
      .select("id, service_type, daycare_format, start_date, end_date, status, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (!profile) notFound();

  const statusLabels: Record<string, string> = {
    pending: "Ожидает", confirmed: "Подтверждено",
    cancelled: "Отменено", completed: "Завершено",
  };
  const serviceLabels: Record<string, string> = { daycare: "Детский сад", hotel: "Гостиница" };
  const formatLabels: Record<string, string> = { hour: "Час", half_day: "Полдня", full_day: "Полный день" };

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/clients" className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">{profile.full_name ?? "Клиент"}</h1>
      </div>

      {/* Профиль */}
      <section className="bg-background rounded-xl border p-5 space-y-2">
        <h2 className="font-semibold mb-3">Данные клиента</h2>
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          {[
            ["ФИО", profile.full_name ?? "—"],
            ["Телефон", profile.phone ?? "—"],
            ["Зарегистрирован", new Date(profile.created_at).toLocaleDateString("ru-RU")],
          ].map(([label, value]) => (
            <div key={label}>
              <span className="text-muted-foreground">{label}: </span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Питомцы */}
      <section className="space-y-3">
        <h2 className="font-semibold">Питомцы ({pets?.length ?? 0})</h2>
        {!pets?.length ? (
          <p className="text-muted-foreground text-sm">Питомцев нет</p>
        ) : (
          <div className="space-y-3">
            {pets.map((pet) => (
              <div key={pet.id} className="bg-background rounded-xl border p-5">
                <div className="flex flex-wrap justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="font-semibold text-base">
                      {pet.name}
                      <span className="text-muted-foreground font-normal text-sm ml-2">
                        {pet.type === "dog" ? "Собака" : "Кошка"}
                        {pet.breed ? ` · ${pet.breed}` : ""}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      {pet.passport_full_name && (
                        <div>ФИО владельца: <span className="text-foreground">{pet.passport_full_name}</span></div>
                      )}
                      {pet.birth_year && <div>Год рождения: {pet.birth_year}</div>}
                      {pet.weight_kg && <div>Вес: {pet.weight_kg} кг</div>}
                      {pet.special_needs && <div>Особые потребности: {pet.special_needs}</div>}
                    </div>
                  </div>

                  {/* Фото паспорта */}
                  {pet.passport_photo_url ? (
                    <a
                      href={pet.passport_photo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={pet.passport_photo_url}
                        alt="Ветпаспорт"
                        className="h-24 w-auto rounded-lg border object-cover hover:opacity-90 transition-opacity"
                      />
                    </a>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                      <FileText className="h-4 w-4" />
                      Паспорт не загружен
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Последние бронирования */}
      <section className="space-y-3">
        <h2 className="font-semibold">Последние заявки</h2>
        {!bookings?.length ? (
          <p className="text-muted-foreground text-sm">Заявок нет</p>
        ) : (
          <div className="space-y-2">
            {bookings.map((b) => (
              <div key={b.id} className="bg-background rounded-xl border px-5 py-3 flex justify-between items-center gap-4">
                <div className="text-sm">
                  <span className="font-medium">
                    {serviceLabels[b.service_type]}
                    {b.daycare_format ? ` — ${formatLabels[b.daycare_format]}` : ""}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    {b.end_date ? `${b.start_date} — ${b.end_date}` : b.start_date}
                  </span>
                </div>
                <Badge
                  variant={b.status === "confirmed" ? "default" : b.status === "cancelled" ? "destructive" : "secondary"}
                  className="text-xs shrink-0"
                >
                  {statusLabels[b.status]}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
