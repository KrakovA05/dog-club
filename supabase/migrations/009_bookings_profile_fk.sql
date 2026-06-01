-- Добавить FK от bookings.user_id к profiles.id
-- чтобы работал join bookings -> profiles в PostgREST
alter table public.bookings
  add constraint bookings_profile_fk
  foreign key (user_id) references public.profiles(id) on delete cascade;
