alter table users alter column email drop not null;

update users
   set email = null
 where role in ('LIDERES', 'CADASTRADOS')
   and email like '%@cadastro.siv.local';
