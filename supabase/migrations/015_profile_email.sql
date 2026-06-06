-- Сохранять email в профиле при регистрации (берём напрямую из auth.users)
alter table public.profiles add column if not exists email text;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    new.email
  );
  return new;
end;
$$;

-- Бэкфилл существующих профилей
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;
