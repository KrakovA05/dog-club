-- Клиентские брони теперь подтверждаются автоматически (status='confirmed').
-- Значит владелец должен иметь возможность отменить и подтверждённую свою бронь,
-- а не только pending. Разрешаем отмену из pending и confirmed (только в cancelled).

drop policy if exists "bookings_owner_cancel" on public.bookings;

create policy "bookings_owner_cancel" on public.bookings
  for update
  using (auth.uid() = user_id and status in ('pending', 'confirmed'))
  with check (status = 'cancelled');
