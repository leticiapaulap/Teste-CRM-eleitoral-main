alter table contact_messages
  add column if not exists user_id uuid references users(id) on delete set null;

alter table contact_messages
  add column if not exists reply text;

alter table contact_messages
  add column if not exists replied_at timestamptz;

alter table contact_messages
  drop constraint if exists contact_messages_status_check;

alter table contact_messages
  add constraint contact_messages_status_check
  check (status in ('NOVO', 'LIDO', 'RESPONDIDO', 'RESOLVIDO'));

create index if not exists contact_messages_user_id_idx on contact_messages (user_id);
