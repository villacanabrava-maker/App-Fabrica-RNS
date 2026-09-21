-- ============================================================
-- 0016 — Convite de membro (factory.invites) + auditoria atômica
--
-- Decisão humana na PR #5 (`[RNS-HUMAN-DECISION]`, subject=invite-schema,
-- comment_id=5767444865): `factory.invites` como entidade separada de
-- `factory.memberships`. `memberships.user_id` continua `not null` — não é
-- relaxado para representar convidados sem conta. Um convite só vira
-- membership quando aceito, na mesma transação que fecha o convite.
--
-- Mesmo padrão de segurança de 0002/0014/0015: funções SECURITY DEFINER,
-- search_path = '', nomes schema-qualificados. Sem policy de INSERT/UPDATE
-- direta em factory.invites — só a função autorizada escreve (mesmo motivo
-- de 0014: abrir INSERT genérico permitiria forjar convites em organizações
-- alheias conhecendo só o organization_id).
--
-- Auditoria: governance.audit_events não tinha caminho de escrita (achado
-- registrado em settings.ts/sprint-1-2-status.md desde a PR #5). Esta
-- migration fecha isso com governance.log_audit_event — SECURITY DEFINER,
-- sem grant a "authenticated" (só chamável por outra função do mesmo dono,
-- nunca direto pela Data API) — e a usa nas 3 novas funções de convite E
-- nas 3 ações administrativas já existentes (organização geral, papel de
-- membro, remoção de membro), convertidas de update/delete diretos para
-- RPC para que mutação + auditoria fiquem atômicas (mesma transação).
--
-- ★ Como estas novas funções de membership são SECURITY DEFINER, elas
-- ignoram RLS nas próprias tabelas (privilégio do dono) — diferente do
-- caminho antigo (update/delete direto via Data API, onde as policies de
-- 0015 são a única defesa). Por isso cada função abaixo reimplementa a
-- MESMA regra de 0015 (owner mexe em qualquer membership; admin nunca
-- escala nem mexe em owner) em vez de confiar no RLS. As policies de 0015
-- continuam intactas e ativas — defesa em profundidade para quem ainda
-- acessa a Data API direto; não removidas nem enfraquecidas aqui.
-- Último owner: continua coberto pelos triggers de 0015
-- (memberships_protect_last_owner / memberships_serialize_owner_changes),
-- que disparam independente de SECURITY DEFINER (triggers não são
-- ignorados por bypass de RLS).
-- ============================================================

create type invite_status as enum ('pending','accepted','revoked','expired');

create table factory.invites (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references factory.organizations(id) on delete cascade,
  email            text not null,
  role             membership_role not null,
  token_hash       text not null unique,
  status           invite_status not null default 'pending',
  invited_by       uuid not null references factory.users(id),
  expires_at       timestamptz not null,
  revoked_at       timestamptz,
  revoked_by       uuid references factory.users(id),
  accepted_at      timestamptz,
  accepted_by      uuid references factory.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz
);

create index on factory.invites (organization_id, status);
-- Não é possível ter dois convites pendentes para o mesmo e-mail na mesma organização.
create unique index invites_org_email_pending_uq
  on factory.invites (organization_id, lower(email))
  where status = 'pending';

alter table factory.invites enable row level security;

-- ★ `grant ... on all tables in schema factory to authenticated` (0009) só
-- alcança as tabelas que já existiam quando aquele GRANT rodou — não há
-- ALTER DEFAULT PRIVILEGES neste projeto, então uma tabela nova (esta)
-- nasce sem nenhum privilégio de tabela para "authenticated". Sem esta
-- linha, mesmo a policy de SELECT abaixo nunca seria alcançada (42501
-- genérico de privilégio de tabela, antes de qualquer RLS). Só select:
-- toda escrita é por função SECURITY DEFINER (dono da tabela, que já tem
-- privilégio pleno sobre o próprio objeto independente de GRANT).
grant select on factory.invites to authenticated;

-- Único acesso direto liberado: owner/admin leem os convites da própria
-- organização (lista de pendentes na tela Equipe). Toda escrita é via função.
create policy "admins read invites"
on factory.invites for select to authenticated
using (factory.user_has_role(organization_id, array['owner','admin']::membership_role[]));

-- ---------- Auditoria: helper interno, não exposto à Data API ----------
create or replace function governance.log_audit_event(
  p_organization_id uuid,
  p_actor_id uuid,
  p_action text,
  p_resource_type text,
  p_resource_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into governance.audit_events
    (organization_id, actor_type, actor_id, action, resource_type, resource_id, metadata)
  values
    (p_organization_id, 'human', p_actor_id::text, p_action, p_resource_type, p_resource_id, p_metadata)
$$;

revoke all on function governance.log_audit_event(uuid, uuid, text, text, uuid, jsonb) from public;

-- ---------- factory.create_invite ----------
create or replace function factory.create_invite(p_organization_id uuid, p_email text, p_role membership_role)
returns table (id uuid, email text, role membership_role, status invite_status, expires_at timestamptz, token text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_email   text := lower(btrim(p_email));
  v_token   text;
  v_hash    text;
  v_invite  factory.invites;
begin
  if v_user_id is null then
    raise exception 'create_invite requer um usuário autenticado';
  end if;

  if not (
    factory.user_has_role(p_organization_id, array['owner']::public.membership_role[])
    or (factory.user_has_role(p_organization_id, array['admin']::public.membership_role[]) and p_role <> 'owner')
  ) then
    raise exception 'sem permissão para convidar com este papel nesta organização';
  end if;

  if v_email = '' or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'e-mail inválido';
  end if;

  if exists (
    select 1 from factory.memberships mem
    join factory.users u on u.id = mem.user_id
    where mem.organization_id = p_organization_id
      and lower(u.email) = v_email
      and mem.accepted_at is not null
  ) then
    raise exception 'este e-mail já é membro da organização';
  end if;

  -- Semântica de expiração: expires_at é a fonte de verdade e `expired` é
  -- materializado sob demanda. Um convite `pending` com expires_at no passado
  -- não pode bloquear um novo convite (o índice único parcial
  -- invites_org_email_pending_uq só enxerga status = 'pending'), então os
  -- vencidos deste e-mail passam a `expired` ANTES da checagem de duplicidade.
  -- Este UPDATE persiste: nenhum RAISE ocorre depois dele no caminho normal
  -- (se um erro posterior abortar a chamada, o UPDATE some junto — e o estado
  -- volta a ser o "pending vencido", que continua tratado como expirado).
  update factory.invites inv
     set status = 'expired', updated_at = now()
   where inv.organization_id = p_organization_id
     and lower(inv.email) = v_email
     and inv.status = 'pending'
     and inv.expires_at < now();

  if exists (
    select 1 from factory.invites inv
    where inv.organization_id = p_organization_id
      and lower(inv.email) = v_email
      and inv.status = 'pending'
  ) then
    raise exception 'já existe um convite pendente para este e-mail — revogue antes de criar outro';
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_hash  := encode(extensions.digest(v_token, 'sha256'), 'hex');

  insert into factory.invites (organization_id, email, role, token_hash, invited_by, expires_at)
  values (p_organization_id, v_email, p_role, v_hash, v_user_id, now() + interval '7 days')
  returning * into v_invite;

  perform governance.log_audit_event(
    p_organization_id, v_user_id, 'invite.created', 'invite', v_invite.id,
    jsonb_build_object('email', v_email, 'role', p_role)
  );

  return query select v_invite.id, v_invite.email, v_invite.role, v_invite.status, v_invite.expires_at, v_token;
end;
$$;

revoke all on function factory.create_invite(uuid, text, membership_role) from public;
grant execute on function factory.create_invite(uuid, text, membership_role) to authenticated;

-- ---------- factory.revoke_invite ----------
create or replace function factory.revoke_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_invite  factory.invites;
begin
  if v_user_id is null then
    raise exception 'revoke_invite requer um usuário autenticado';
  end if;

  select * into v_invite from factory.invites where id = p_invite_id;
  if not found then
    raise exception 'convite não encontrado';
  end if;

  if not (
    factory.user_has_role(v_invite.organization_id, array['owner']::public.membership_role[])
    or (factory.user_has_role(v_invite.organization_id, array['admin']::public.membership_role[]) and v_invite.role <> 'owner')
  ) then
    raise exception 'sem permissão para revogar este convite';
  end if;

  if v_invite.status <> 'pending' then
    raise exception 'apenas convites pendentes podem ser revogados';
  end if;

  update factory.invites
     set status = 'revoked', revoked_at = now(), revoked_by = v_user_id, updated_at = now()
   where id = p_invite_id;

  perform governance.log_audit_event(
    v_invite.organization_id, v_user_id, 'invite.revoked', 'invite', v_invite.id,
    jsonb_build_object('email', v_invite.email)
  );
end;
$$;

revoke all on function factory.revoke_invite(uuid) from public;
grant execute on function factory.revoke_invite(uuid) to authenticated;

-- ---------- factory.get_invite_preview ----------
-- Único ponto de leitura de convite liberado para anon: só pelo token exato
-- (sha256), nunca por listagem. Usado pela tela pública /aceitar-convite
-- para mostrar "convite para <e-mail> em <organização>" antes do login.
create or replace function factory.get_invite_preview(p_token text)
returns table (organization_name text, email text, role membership_role, status invite_status, expires_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  -- Status efetivo: pending + expires_at no passado é exposto como `expired`.
  select o.name, i.email, i.role,
         case when i.status = 'pending' and i.expires_at < now()
              then 'expired'::public.invite_status else i.status end,
         i.expires_at
  from factory.invites i
  join factory.organizations o on o.id = i.organization_id
  where i.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
$$;

revoke all on function factory.get_invite_preview(text) from public;
grant execute on function factory.get_invite_preview(text) to anon, authenticated;

-- ---------- factory.accept_invite ----------
create or replace function factory.accept_invite(p_token text)
returns factory.memberships
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id     uuid := auth.uid();
  v_user_email  text;
  v_invite      factory.invites;
  v_membership  factory.memberships;
begin
  if v_user_id is null then
    raise exception 'accept_invite requer um usuário autenticado';
  end if;

  select email into v_user_email from factory.users where id = v_user_id;
  if v_user_email is null then
    raise exception 'perfil de usuário não encontrado';
  end if;

  select * into v_invite
    from factory.invites
   where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
   for update;

  if not found then
    raise exception 'convite inválido';
  end if;

  -- Não persiste status = 'expired' aqui: o UPDATE seria desfeito junto
  -- com a própria transação ao dar raise logo em seguida (Postgres não
  -- distingue "commita isto, depois aborta"; sem autonomous transaction,
  -- todo efeito da chamada é revertido quando a exceção sobe). A
  -- materialização de `expired` acontece em factory.create_invite (caminho
  -- que segue adiante e commita). Aqui, tanto `expired` já materializado
  -- quanto `pending` com expires_at no passado são "convite expirado".
  if v_invite.status = 'expired'
     or (v_invite.status = 'pending' and v_invite.expires_at < now()) then
    raise exception 'convite expirado';
  end if;

  if v_invite.status <> 'pending' then
    raise exception 'convite não está mais disponível';
  end if;

  if lower(v_user_email) <> v_invite.email then
    raise exception 'este convite foi emitido para outro e-mail';
  end if;

  if exists (
    select 1 from factory.memberships
    where organization_id = v_invite.organization_id and user_id = v_user_id
  ) then
    raise exception 'você já é membro desta organização';
  end if;

  insert into factory.memberships (organization_id, user_id, role, invited_by, accepted_at)
  values (v_invite.organization_id, v_user_id, v_invite.role, v_invite.invited_by, now())
  returning * into v_membership;

  update factory.invites
     set status = 'accepted', accepted_at = now(), accepted_by = v_user_id, updated_at = now()
   where id = v_invite.id;

  perform governance.log_audit_event(
    v_invite.organization_id, v_user_id, 'invite.accepted', 'membership', v_membership.id,
    jsonb_build_object('email', v_invite.email, 'role', v_invite.role)
  );

  return v_membership;
end;
$$;

revoke all on function factory.accept_invite(text) from public;
grant execute on function factory.accept_invite(text) to authenticated;

-- ---------- Ações administrativas existentes: mutação + auditoria atômica ----------
-- Substituem os update/delete diretos de settings.ts. RLS (0009/0015)
-- continua ativa e intocada para quem acessa a Data API direto; estas
-- funções são o caminho usado pela aplicação a partir de agora, e
-- reimplementam a mesma regra de autorização porque SECURITY DEFINER
-- ignora RLS nas próprias tabelas.

create or replace function factory.update_organization_general(
  p_organization_id uuid, p_name text, p_description text, p_timezone text
)
returns factory.organizations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_org     factory.organizations;
begin
  if v_user_id is null then
    raise exception 'update_organization_general requer um usuário autenticado';
  end if;

  if not factory.user_has_role(p_organization_id, array['owner','admin']::public.membership_role[]) then
    raise exception 'apenas owner ou admin podem alterar a organização';
  end if;

  if p_name is null or btrim(p_name) = '' then
    raise exception 'name é obrigatório';
  end if;

  update factory.organizations
     set name = btrim(p_name),
         description = nullif(btrim(coalesce(p_description, '')), ''),
         timezone = coalesce(nullif(btrim(coalesce(p_timezone, '')), ''), timezone),
         updated_at = now()
   where id = p_organization_id
  returning * into v_org;

  if not found then
    raise exception 'organização não encontrada';
  end if;

  perform governance.log_audit_event(
    p_organization_id, v_user_id, 'organization.updated', 'organization', p_organization_id,
    jsonb_build_object('name', v_org.name)
  );

  return v_org;
end;
$$;

revoke all on function factory.update_organization_general(uuid, text, text, text) from public;
grant execute on function factory.update_organization_general(uuid, text, text, text) to authenticated;

create or replace function factory.update_member_role(p_membership_id uuid, p_role membership_role)
returns factory.memberships
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id     uuid := auth.uid();
  v_actor_role  public.membership_role;
  v_target      factory.memberships;
begin
  if v_user_id is null then
    raise exception 'update_member_role requer um usuário autenticado';
  end if;

  select * into v_target from factory.memberships where id = p_membership_id;
  if not found then
    raise exception 'membro não encontrado nesta organização';
  end if;

  select role into v_actor_role
    from factory.memberships
   where organization_id = v_target.organization_id
     and user_id = v_user_id
     and accepted_at is not null;

  if v_actor_role is null or v_actor_role not in ('owner', 'admin') then
    raise exception 'apenas owner ou admin podem alterar papéis';
  end if;

  if v_actor_role <> 'owner' and (v_target.role = 'owner' or p_role = 'owner') then
    raise exception 'apenas owner pode atribuir o papel owner ou alterar outro owner';
  end if;

  -- último owner: memberships_protect_last_owner (0015) dispara neste UPDATE
  -- independente de SECURITY DEFINER e barra a demoção se for o único owner.
  update factory.memberships
     set role = p_role, updated_at = now()
   where id = p_membership_id
  returning * into v_target;

  perform governance.log_audit_event(
    v_target.organization_id, v_user_id, 'membership.role_updated', 'membership', v_target.id,
    jsonb_build_object('role', p_role)
  );

  return v_target;
end;
$$;

revoke all on function factory.update_member_role(uuid, membership_role) from public;
grant execute on function factory.update_member_role(uuid, membership_role) to authenticated;

create or replace function factory.remove_member(p_membership_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id     uuid := auth.uid();
  v_actor_role  public.membership_role;
  v_target      factory.memberships;
begin
  if v_user_id is null then
    raise exception 'remove_member requer um usuário autenticado';
  end if;

  select * into v_target from factory.memberships where id = p_membership_id;
  if not found then
    raise exception 'membro não encontrado nesta organização';
  end if;

  select role into v_actor_role
    from factory.memberships
   where organization_id = v_target.organization_id
     and user_id = v_user_id
     and accepted_at is not null;

  if v_actor_role is null or v_actor_role not in ('owner', 'admin') then
    raise exception 'apenas owner ou admin podem remover membros';
  end if;

  if v_actor_role <> 'owner' and v_target.role = 'owner' then
    raise exception 'apenas owner pode remover outro owner';
  end if;

  -- último owner: memberships_protect_last_owner (0015) dispara neste DELETE
  -- independente de SECURITY DEFINER e barra a remoção se for o único owner.
  delete from factory.memberships where id = p_membership_id;

  perform governance.log_audit_event(
    v_target.organization_id, v_user_id, 'membership.removed', 'membership', v_target.id,
    jsonb_build_object('email', (select email from factory.users where id = v_target.user_id))
  );
end;
$$;

revoke all on function factory.remove_member(uuid) from public;
grant execute on function factory.remove_member(uuid) to authenticated;
