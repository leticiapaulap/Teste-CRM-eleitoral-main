alter table users alter column role drop default;
alter table users alter column role type text using role::text;

update users
   set role = case role
     when 'DEPUTADO' then 'EQUIPE'
     when 'EQUIPE' then 'EQUIPE'
     when 'LIDER' then 'LIDERES'
     when 'PESSOA' then 'CADASTRADOS'
     else role
   end;

drop type if exists user_role;
create type user_role as enum ('EQUIPE', 'COORDENADORES', 'LIDERES', 'CADASTRADOS');

alter table users
  alter column role type user_role using role::user_role,
  alter column role set default 'CADASTRADOS';
