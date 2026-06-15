-- Гостевые брони: позволяет создавать запись без регистрации клиента.
-- user_id и pet_id становятся nullable; гостевые данные хранятся в самой брони.

-- Убираем NOT NULL с внешних ключей
ALTER TABLE public.bookings ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN pet_id DROP NOT NULL;

-- Добавляем поля для гостевого клиента и питомца
ALTER TABLE public.bookings
  ADD COLUMN guest_name       text,
  ADD COLUMN guest_phone      text,
  ADD COLUMN guest_pet_name   text,
  ADD COLUMN guest_pet_type   text CHECK (guest_pet_type IN ('dog', 'cat')),
  ADD COLUMN guest_pet_breed  text,
  ADD COLUMN guest_pet_weight numeric;

-- Бронь должна иметь либо зарегистрированного клиента, либо гостевые данные
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_client_check
  CHECK (
    (user_id IS NOT NULL AND pet_id IS NOT NULL) OR
    (guest_name IS NOT NULL AND guest_pet_name IS NOT NULL AND guest_pet_type IS NOT NULL)
  );
