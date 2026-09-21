-- ============================================================
-- 0014 — Bootstrap de organização (Sprint 1.2)
--
-- Achado ao implementar "criação de organização no primeiro acesso": não
-- existe policy de INSERT em factory.organizations, e a única policy de
-- escrita em factory.memberships ("admins manage memberships") exige que o
-- usuário já seja owner/admin da organização — logicamente impossível para
-- a primeira membership de uma organização nova (ninguém é membro ainda).
--
-- Consultado via /fiscal na PR #5 antes de escrever esta migration.
-- Parecer (request_id fiscal_e2e3a330b5652c9b5bb3e602): função
-- SECURITY DEFINER é a direção correta; NÃO abrir policy de INSERT direta
-- em organizations/memberships (permitiria autoelevação em organização
-- já existente — qualquer autenticado poderia inserir a si mesmo como
-- owner de qualquer organization_id, não só de uma recém-criada).
--
-- Mesmo padrão já usado em factory.user_organizations()/user_has_role()
-- (0002_identity_and_apps.sql): SECURITY DEFINER, search_path = '',
-- nomes schema-qualificados, execução restrita a authenticated. A função
-- roda como dono (papel de migration, o mesmo dono das tabelas), que já
-- ignora RLS nas próprias tabelas por padrão — não é necessário (e o
-- fiscal pediu explicitamente para não fazer) nenhum grant novo de INSERT
-- em organizations/memberships: grant select, insert, update on all
-- tables in schema factory to authenticated já existe desde
-- 0009_rls_policies.sql; quem bloqueia o insert direto hoje é só RLS.
--
-- Sem exception handler interno: se o segundo insert (membership) falhar,
-- o primeiro (organization) desfaz junto — todo o corpo da função roda na
-- transação do chamador.
--
-- ★ Achado do fiscal (request_id fiscal_7aefb81016cdbd4594cd9ee2): a versão
-- anterior deste comentário dizia "escopo é só o bootstrap da PRIMEIRA
-- organização", mas o código nunca impôs isso — qualquer usuário
-- autenticado pode chamar esta função quantas vezes quiser, virando owner
-- de uma organização nova a cada chamada. Contrato declarado divergia do
-- comportamento real. Corrigido aqui para descrever o que a função de
-- fato faz, não o que a documentação presumia.
--
-- Esta função cria uma organização nova e torna o chamador seu owner, sem
-- limite de quantas vezes um mesmo usuário pode chamá-la nem verificação
-- de membership prévia — não é exclusiva de "primeiro acesso". Não é um
-- caminho genérico para criar memberships arbitrárias em organizações já
-- existentes (isso continua exclusivo de "admins manage memberships") nem
-- aceita role: quem chama sempre vira 'owner' da organização que acabou
-- de criar, nunca de uma organização pré-existente.
--
-- Limite de organizações por usuário: não há regra documentada em nenhum
-- lugar canônico (docs/01-PRODUTO/04-DECISOES-CONGELADAS.md não cobre
-- isso) — não é UNSPECIFIED por omissão do código, é uma decisão de
-- produto real ainda não tomada. Se um limite vier a existir, precisa ser
-- imposto aqui (ou em constraint/trigger), não só na UI — a função é
-- chamável diretamente via RPC, então uma checagem só na Server Action
-- não seria uma defesa real.
-- ============================================================

create or replace function factory.create_organization(p_name text, p_slug text)
returns factory.organizations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_org factory.organizations;
begin
  if v_user_id is null then
    raise exception 'create_organization requer um usuário autenticado';
  end if;

  if p_name is null or btrim(p_name) = '' then
    raise exception 'name é obrigatório';
  end if;

  if p_slug is null or btrim(p_slug) = '' then
    raise exception 'slug é obrigatório';
  end if;

  insert into factory.organizations (name, slug)
  values (btrim(p_name), btrim(p_slug))
  returning * into v_org;

  insert into factory.memberships (organization_id, user_id, role, accepted_at)
  values (v_org.id, v_user_id, 'owner', now());

  return v_org;
end;
$$;

revoke all on function factory.create_organization(text, text) from public;
grant execute on function factory.create_organization(text, text) to authenticated;
