-- Цены на услуги
create table public.prices (
  id uuid primary key default gen_random_uuid(),
  service_type text not null check (service_type in ('daycare', 'hotel')),
  label text not null,
  description text,
  price integer not null,
  unit text not null default 'сутки',
  is_featured boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- FAQ
create table public.faq (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- Отзывы
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  text text not null,
  rating integer not null check (rating between 1 and 5),
  pet_type text,
  is_published boolean default false,
  created_at timestamptz default now()
);

-- Галерея
create table public.gallery (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  alt text not null default '',
  sort_order integer default 0,
  created_at timestamptz default now()
);

alter table public.prices enable row level security;
alter table public.faq enable row level security;
alter table public.reviews enable row level security;
alter table public.gallery enable row level security;

create policy "prices_public_read" on public.prices for select using (true);
create policy "faq_public_read" on public.faq for select using (true);
create policy "reviews_public_read" on public.reviews for select using (is_published = true);
create policy "gallery_public_read" on public.gallery for select using (true);

insert into public.prices (service_type, label, description, price, unit, is_featured, sort_order) values
  ('daycare', 'Час',        'Разовое посещение, до 60 минут',         400,  'час',     false, 1),
  ('daycare', 'Полдня',     '~5 часов, кормление включено',           1200, 'день',    true,  2),
  ('daycare', 'Полный день','~11 часов, кормление и прогулки',        1800, 'день',    false, 3),
  ('hotel',   'Сутки',      'Открытый бокс, кормление, прогулки',    1500, 'сутки',   true,  1),
  ('hotel',   'Воспитание', 'По запросу хозяина, за занятие',         800,  'занятие', false, 2);

insert into public.faq (question, answer, sort_order) values
  ('Каких животных вы принимаете?', 'Мы принимаем собак и кошек весом до 15 кг. Для каждого питомца требуется ветеринарный паспорт с актуальными прививками.', 1),
  ('Нужны ли прививки?', 'Да, обязательно. Необходимы актуальные прививки от бешенства, чумы, гепатита, парвовируса (для собак) или панлейкопении (для кошек).', 2),
  ('Как я могу видеть своего питомца?', 'Мы отправляем фото и видео по запросу в WhatsApp.', 3),
  ('Что взять с собой для питомца?', 'Еду на весь период, любимую игрушку или подстилку с запахом дома — это снижает стресс. Ветпаспорт обязателен.', 4),
  ('Принимаете ли вы питомцев с заболеваниями?', 'Принимаем — каждый случай обсуждается индивидуально. Напишите нам заранее, и мы оценим возможность.', 5),
  ('Как забронировать место?', 'Заполните форму на сайте или напишите нам в WhatsApp. Подтверждаем в течение нескольких часов.', 6);
