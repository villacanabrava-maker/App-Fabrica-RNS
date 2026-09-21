-- ============================================================
-- 0015 — Endurecimento de factory.memberships: admin não escala para owner
--
-- Finding confirmado na PR #5 (Fiscal R1, rodada de 21/09/2026): a policy
-- "admins manage memberships" (0009_rls_policies.sql) é `for all` com
-- USING/WITH CHECK = owner OU admin, sem olhar o papel escrito. Logo, um
-- `admin` autenticado consegue, direto pela Data API (sem passar pela UI
-- nem por Server Action):
--   - promover qualquer membro (ou a si mesmo) a `owner`;
--   - rebaixar ou remover um `owner`;
--   - inserir uma membership nova já com role `owner`.
-- A checagem só na Server Action (settings.ts) não é defesa real: a Data
-- API é chamável diretamente. Esta migration impõe a regra no banco.
--
-- Regra imposta (owner é o único que mexe em owner):
--   - owner            : insere/atualiza/remove qualquer membership da sua organização;
--   - admin            : só toca memberships cujo papel atual NÃO é owner e
--                        só escreve papéis diferentes de owner;
--   - demais papéis    : nenhuma escrita (continuam só lendo, via
--                        "members read memberships", inalterada).
-- USING vale para a linha existente (papel atual); WITH CHECK, para a linha
-- resultante (papel novo). Um admin que tenta escrever `owner` recebe 42501;
-- ao tentar alterar/remover uma linha de owner, a linha é invisível para a
-- policy e a operação afeta 0 linhas.
--
-- Correção (Fiscal R1, achado 1): `authenticated` só tinha GRANT
-- select/insert/update (0009) — `removeMember()` (settings.ts) faz DELETE
-- via cliente autenticado e falhava sempre (42501, privilégio de tabela
-- ausente), mesmo para owner. A policy de DELETE só filtra linhas; sem o
-- GRANT abaixo ela nunca chega a ser avaliada.
--
-- Migration histórica NÃO é editada: 0009 permanece como foi aplicada; aqui
-- a policy antiga é removida e substituída por três policies separadas.
--
-- Último owner: a checagem só na aplicação (settings.ts, `isLastOwner`) era
-- dívida registrada em sprint-1-2-status.md — nada no banco impedia deixar
-- a organização sem owner. O trigger abaixo fecha isso no banco, inclusive
-- para chamadas diretas à Data API. Exceção deliberada: quando a própria
-- organização está sendo apagada (ON DELETE CASCADE das memberships), a
-- remoção é permitida.
--
-- Correção (Fiscal R2, achado 4): o `FOR UPDATE` sozinho (ver função abaixo)
-- reduz a janela de corrida mas não evita deadlock — quando duas transações
-- removem/rebaixam owners DISTINTOS da mesma organização, cada UPDATE/DELETE
-- já trava sua própria linha (OLD) antes do trigger BEFORE ROW rodar; ao
-- tentar o `FOR UPDATE` na linha do outro owner, cada transação espera a
-- outra, que por sua vez espera a primeira — deadlock. Postgres aborta uma
-- das duas (nunca as duas commitam, então a integridade nunca foi violada),
-- mas isso ainda é uma falha operacional evitável, não só tolerável. Um
-- gatilho BEFORE STATEMENT roda antes de qualquer linha ser travada pelo
-- UPDATE/DELETE em si; um advisory lock ali serializa as duas transações
-- ANTES de qualquer uma travar sua própria linha, eliminando o deadlock
-- (a segunda espera a primeira terminar, sem ciclo de espera possível).
-- ============================================================

-- ponytail: lock global (não por organização) — trata todas as orgs como
-- uma fila só. Suficiente para o volume de alterações de owner do MVP;
-- trocar por advisory lock por organization_id (ex.: hashtext do uuid) se
-- isso virar gargalo real de throughput.
create or replace function factory.serialize_owner_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext('factory.memberships:protect_last_owner'));
  return null;
end;
$$;

revoke all on function factory.serialize_owner_changes() from public;

create trigger memberships_serialize_owner_changes
before update or delete on factory.memberships
for each statement execute function factory.serialize_owner_changes();

drop policy "admins manage memberships" on factory.memberships;

create policy "admins insert memberships"
on factory.memberships for insert to authenticated
with check (
  factory.user_has_role(organization_id, array['owner']::membership_role[])
  or (factory.user_has_role(organization_id, array['admin']::membership_role[]) and role <> 'owner')
);

create policy "admins update memberships"
on factory.memberships for update to authenticated
using (
  factory.user_has_role(organization_id, array['owner']::membership_role[])
  or (factory.user_has_role(organization_id, array['admin']::membership_role[]) and role <> 'owner')
)
with check (
  factory.user_has_role(organization_id, array['owner']::membership_role[])
  or (factory.user_has_role(organization_id, array['admin']::membership_role[]) and role <> 'owner')
);

create policy "admins delete memberships"
on factory.memberships for delete to authenticated
using (
  factory.user_has_role(organization_id, array['owner']::membership_role[])
  or (factory.user_has_role(organization_id, array['admin']::membership_role[]) and role <> 'owner')
);

grant delete on factory.memberships to authenticated;

-- ---------- Último owner protegido no banco ----------
-- SECURITY DEFINER + search_path vazio (mesmo padrão de 0002/0014): a
-- contagem de owners precisa enxergar todas as linhas da organização,
-- independentemente do RLS de quem está escrevendo.
create or replace function factory.protect_last_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'owner'
     and old.accepted_at is not null
     and (tg_op = 'DELETE'
          or new.role <> 'owner'
          or new.accepted_at is null
          or new.organization_id <> old.organization_id)
  then
    -- Organização sendo apagada (cascade): a linha da organização já não existe.
    if not exists (select 1 from factory.organizations where id = old.organization_id) then
      return case when tg_op = 'DELETE' then old else new end;
    end if;

    -- FOR UPDATE: a serialização real contra corrida entre transações
    -- concorrentes é o advisory lock do gatilho BEFORE STATEMENT acima
    -- (memberships_serialize_owner_changes), que roda antes de qualquer
    -- linha ser travada pelo UPDATE/DELETE — por isso não deadlocka. Este
    -- FOR UPDATE aqui é redundante mas inofensivo com o advisory lock já
    -- ativo (nunca vai encontrar contenção real); mantido como defesa em
    -- profundidade caso o advisory lock seja removido no futuro.
    if not exists (
      select 1 from factory.memberships
       where organization_id = old.organization_id
         and id <> old.id
         and role = 'owner'
         and accepted_at is not null
       for update
    ) then
      raise exception 'último owner da organização não pode ser removido nem rebaixado';
    end if;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function factory.protect_last_owner() from public;

create trigger memberships_protect_last_owner
before update or delete on factory.memberships
for each row execute function factory.protect_last_owner();
