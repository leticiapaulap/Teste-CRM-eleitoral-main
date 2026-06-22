create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('EQUIPE', 'COORDENADORES', 'LIDERES', 'CADASTRADOS');
  end if;
end $$;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  password_hash text not null,
  role user_role not null default 'CADASTRADOS',
  photo_url text,
  active boolean not null default true,
  consent_accepted boolean not null default false,
  consent_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists users_email_unique on users (lower(email));
create index if not exists users_role_idx on users (role);
create index if not exists users_created_at_idx on users (created_at);

create table if not exists leader_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  referral_code text not null unique,
  referral_url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists network_nodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  parent_user_id uuid references users(id) on delete set null,
  root_leader_id uuid references users(id) on delete set null,
  referral_code_used text,
  level integer not null default 0 check (level >= 0),
  created_at timestamptz not null default now()
);

create index if not exists network_parent_idx on network_nodes (parent_user_id);
create index if not exists network_root_idx on network_nodes (root_leader_id);
create index if not exists network_level_idx on network_nodes (level);

create table if not exists user_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  localidade text not null,
  regiao_administrativa text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  created_at timestamptz not null default now()
);

create index if not exists user_locations_localidade_idx on user_locations (localidade);
create index if not exists user_locations_regiao_idx on user_locations (regiao_administrativa);

create table if not exists profile_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  file_url text not null,
  file_name text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size integer not null check (size > 0),
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users(id) on delete set null,
  action text not null,
  target_user_id uuid references users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists users_set_updated_at on users;
create trigger users_set_updated_at
before update on users
for each row execute function set_updated_at();

drop trigger if exists leader_profiles_set_updated_at on leader_profiles;
create trigger leader_profiles_set_updated_at
before update on leader_profiles
for each row execute function set_updated_at();
