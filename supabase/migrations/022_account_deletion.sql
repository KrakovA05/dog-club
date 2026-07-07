-- Удаление аккаунта (право на удаление, ст. 14 152-ФЗ).
--
-- Брони по политике конфиденциальности хранятся 3 года (бухучёт) — их НЕ удаляем,
-- а обезличиваем: переводим в «гостевой» формат без ссылок на пользователя.
-- Это обязательно делать ДО удаления auth.users: user_id → profiles(id) и
-- pet_id → pets(id) стоят с ON DELETE CASCADE (миграции 003/009) — без
-- обезличивания каскад снёс бы и сами брони.
--
-- Нюансы, которые учитывает функция:
--  * check-констрейнт bookings_client_check (миграция 019) требует при
--    user_id IS NULL заполненных guest_name + guest_pet_name + guest_pet_type —
--    заполняем обезличенными значениями, тип питомца берём из pets (не ПДн,
--    нужен для истории вместимости: booking_zone считает по типу).
--  * триггер bookings_enforce_capacity перепроверяет вместимость при смене
--    pet_id — на время обезличивания отключаем триггеры транзакционно через
--    session_replication_role=replica (функция от владельца БД).
--
-- Идемпотентна: create or replace; повторный вызов для уже обезличенных
-- броней ничего не меняет (user_id уже NULL — не попадают под WHERE).

create or replace function public.anonymize_user_bookings(p_user uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  -- Отключаем триггеры до конца транзакции (enforce_capacity перепроверял бы
  -- вместимость задним числом и мог заблокировать удаление аккаунта)
  perform set_config('session_replication_role', 'replica', true);

  update public.bookings b set
    guest_name       = 'Удалённый пользователь',
    guest_phone      = null,
    guest_pet_name   = 'Питомец',
    guest_pet_breed  = null,
    guest_pet_weight = null,
    -- реальный тип сохраняем: не ПДн, нужен для статистики вместимости
    guest_pet_type   = coalesce(p.type, b.guest_pet_type, 'dog'),
    user_id          = null,
    pet_id           = null
  from public.pets p
  where b.user_id = p_user
    and p.id = b.pet_id;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Только сервисный клиент: вызывается из Server Action deleteAccount()
revoke execute on function public.anonymize_user_bookings(uuid) from public;
revoke execute on function public.anonymize_user_bookings(uuid) from anon;
revoke execute on function public.anonymize_user_bookings(uuid) from authenticated;
grant execute on function public.anonymize_user_bookings(uuid) to service_role;
