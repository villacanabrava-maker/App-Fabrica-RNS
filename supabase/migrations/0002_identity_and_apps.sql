-- ============================================================
-- 0002 — Identidade, organizações e aplicativos
-- ============================================================

create table factory.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  description   text,
  logo_url      text,
  timezone      text not null default 'America/Sao_Paulo',
  locale        text not null default 'pt-BR',
  settings      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz
);

create table factory.users (
  id                        uuid primary key,   -- = auth.users.id
  email                     text not null unique,
  full_name                 text,
  avatar_url                text,
  default_organization_id   uuid references factory.organizations(id),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz
);

create table factory.memberships (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references factory.organizations(id) on delete cascade,
  user_id           uuid not null references factory.users(id) on delete cascade,
  role              membership_role not null,
  invited_by        uuid references factory.users(id),
  accepted_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz,
  unique (organization_id, user_id)
);

create index on factory.memberships (user_id) where accepted_at is not null;

-- Funções auxiliares.
--
-- ★ SECURITY DEFINER, deliberadamente — não INVOKER.
-- As policies de RLS de factory.memberships (ver 0009) chamam estas
-- funções. Se elas rodassem como INVOKER, a consulta interna a
-- factory.memberships voltaria a aplicar a própria policy de
-- memberships, que chama a função de novo: "infinite recursion
-- detected in policy for relation \"memberships\"" — e quebraria toda
-- policy do sistema, porque praticamente todas dependem destas duas
-- funções. SECURITY DEFINER roda com o privilégio do dono da função
-- (o role de migração, dono também da tabela, que por padrão já
-- ignora RLS em suas próprias tabelas), rompendo o ciclo.
-- search_path fixo em '' é obrigatório com SECURITY DEFINER — sem
-- isso, um objeto malicioso criado antes na busca de schema do
-- chamador poderia sequestrar a função. Todas as referências no corpo
-- já são schema-qualificadas.
-- A função só enxerga as próprias memberships do chamador (auth.uid()
-- não é parâmetro, não pode ser falsificado), então o bypass de RLS
-- aqui dentro não vaza dado de outro usuário.
create or replace function factory.user_organizations()
returns setof uuid
language sql stable security definer
set search_path = ''
as $$
  select organization_id
  from factory.memberships
  where user_id = auth.uid()
    and accepted_at is not null
$$;

create or replace function factory.user_has_role(org uuid, required membership_role[])
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from factory.memberships
    where user_id = auth.uid()
      and organization_id = org
      and accepted_at is not null
      and role = any(required)
  )
$$;

revoke all on function factory.user_organizations() from public;
grant execute on function factory.user_organizations() to authenticated;

revoke all on function factory.user_has_role(uuid, membership_role[]) from public;
grant execute on function factory.user_has_role(uuid, membership_role[]) to authenticated;

-- ---------- Aplicativos (na UI: "Projetos") ----------
create table factory.apps (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references factory.organizations(id) on delete cascade,
  name              text not null,
  slug              text not null,
  description       text,
  icon              text,
  color             text,
  status            app_status not null default 'planning',
  progress_percent  smallint not null default 0,
  started_at        date,
  target_date       date,
  tags              text[] not null default '{}',
  created_by        uuid references factory.users(id),
  archived_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz,
  unique (organization_id, slug),
  constraint apps_progress_range check (progress_percent between 0 and 100)
);

create index on factory.apps (organization_id, status);
create index on factory.apps (organization_id, updated_at desc);

create table factory.app_specs (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references factory.organizations(id) on delete cascade,
  app_id            uuid not null references factory.apps(id) on delete cascade,
  version           integer not null,
  content_md        text not null,
  content_sha       char(64) not null,
  status            spec_status not null default 'draft',
  approved_by       uuid references factory.users(id),
  approved_at       timestamptz,
  created_at        timestamptz not null default now(),
  unique (app_id, version)
);

create table factory.app_environments (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references factory.organizations(id) on delete cascade,
  app_id                uuid not null references factory.apps(id) on delete cascade,
  kind                  environment_kind not null,
  url                   text,
  supabase_project_ref  text,
  vercel_project_id     text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz,
  unique (app_id, kind)
);

-- ---------- Missões e etapas ----------
create table factory.missions (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references factory.organizations(id) on delete cascade,
  app_id            uuid not null references factory.apps(id) on delete cascade,
  title             text not null,
  objective         text not null,
  status            mission_status not null default 'draft',
  current_version   integer not null default 1,
  created_by        uuid references factory.users(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz
);

create table factory.mission_versions (
  id          uuid primary key default gen_random_uuid(),
  mission_id  uuid not null references factory.missions(id) on delete cascade,
  version     integer not null,
  plan_md     text not null,
  plan_sha    char(64) not null,
  git_sha     char(40),
  status      version_status not null default 'draft',
  created_at  timestamptz not null default now(),
  unique (mission_id, version)
);

create table factory.stages (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references factory.organizations(id) on delete cascade,
  mission_id            uuid not null references factory.missions(id) on delete cascade,
  sequence              integer not null,
  title                 text not null,
  description           text,
  status                stage_status not null default 'pending',
  acceptance_criteria   jsonb not null default '[]'::jsonb,
  approved_by           uuid references factory.users(id),
  approved_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz,
  unique (mission_id, sequence)
);
