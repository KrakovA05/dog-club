-- Выставляем сервисным ролям пароль из POSTGRES_PASSWORD.
-- Образ supabase/postgres создаёт роли, но их пароли не совпадают с тем, что
-- ждут auth/rest/storage в connection string'ах compose — без этого фикса
-- GoTrue/PostgREST/storage-api не подключаются к БД.
-- Выполняется один раз при инициализации пустого volume (docker-entrypoint-initdb.d).
\set pgpass `echo "$POSTGRES_PASSWORD"`

ALTER USER authenticator WITH PASSWORD :'pgpass';
ALTER USER pgbouncer WITH PASSWORD :'pgpass';
ALTER USER supabase_auth_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_functions_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_storage_admin WITH PASSWORD :'pgpass';
