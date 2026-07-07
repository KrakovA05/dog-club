"use server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Result = { success: true } | { success: false; error: string };

// Удаление аккаунта (ст. 14 152-ФЗ). ПОРЯДОК МЕНЯТЬ НЕЛЬЗЯ:
// 1) СНАЧАЛА обезличить брони. bookings.user_id → profiles(id) и
//    bookings.pet_id → pets(id) стоят с ON DELETE CASCADE (миграции 003/009):
//    если удалить auth.users первым, каскад МОЛЧА снесёт все брони,
//    которые по политике хранятся 3 года (бухучёт).
// 2) удалить файлы паспортов из Storage (пути <uid>/...);
// 3) удалить auth.users — каскад сносит profiles и pets;
// 4) погасить сессию.
export async function deleteAccount(): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // Удалять можно только себя — uid берётся из сессии, параметров нет
  if (!user) return { success: false, error: "Не авторизован" };

  const admin = createAdminClient();

  // 1) Обезличивание броней (SQL-функция, миграция 025: копирует данные
  // питомца в guest_*-поля до обнуления pet_id — иначе check-констрейнт)
  const { error: anonError } = await admin.rpc("anonymize_user_bookings", {
    target_uid: user.id,
  });
  if (anonError) {
    console.error("[delete-account] anonymize:", anonError.message);
    return { success: false, error: "Не удалось обезличить записи о бронях" };
  }

  // 2) Файлы паспортов питомцев. Ошибки не блокируют удаление аккаунта —
  // осиротевшие файлы хуже, чем неудалённый аккаунт, но не настолько,
  // чтобы отказывать субъекту в праве на удаление.
  try {
    const { data: files } = await admin.storage.from("passports").list(user.id);
    if (files && files.length > 0) {
      const { error: rmError } = await admin.storage
        .from("passports")
        .remove(files.map((f) => `${user.id}/${f.name}`));
      if (rmError) console.error("[delete-account] storage:", rmError.message);
    }
  } catch (e) {
    console.error("[delete-account] storage:", e instanceof Error ? e.message : e);
  }

  // 3) auth.users → каскадом profiles и pets
  const { error: delError } = await admin.auth.admin.deleteUser(user.id);
  if (delError) {
    console.error("[delete-account] deleteUser:", delError.message);
    return { success: false, error: "Не удалось удалить аккаунт, попробуйте позже" };
  }

  // 4) Чистим cookies сессии (пользователя уже нет)
  await supabase.auth.signOut();

  return { success: true };
}
