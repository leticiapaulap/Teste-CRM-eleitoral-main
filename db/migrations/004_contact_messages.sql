create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  message text not null,
  status text not null default 'NOVO' check (status in ('NOVO', 'LIDO')),
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_status_idx on contact_messages (status);
create index if not exists contact_messages_created_at_idx on contact_messages (created_at);
