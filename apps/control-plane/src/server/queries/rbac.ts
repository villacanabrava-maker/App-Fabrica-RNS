import type { MembershipRole } from './organizations';

/**
 * Resumo de 09-CONFIGURACOES.md §4 (aba Equipe) / 05-SEGURANCA/02 —
 * matriz de permissões por papel humano. RBAC de agentes (R1-R9) é outro
 * registry (factory-intelligence/registry/permissions.yaml) — este é o
 * RBAC de usuário humano na UI.
 */
const ROLE_RANK: Record<MembershipRole, number> = {
  viewer: 0,
  engineer: 1,
  admin: 2,
  owner: 3,
};

export function hasAtLeastRole(role: MembershipRole, required: MembershipRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[required];
}

/**
 * 09-CONFIGURACOES.md §1: "Permissão mínima: viewer para ver o próprio
 * perfil; admin para a maioria" — owner/admin é o piso comum a Geral,
 * Equipe e Segurança. Único ponto de verdade: as três (e settings.ts,
 * que altera papel/remove membro) chamam esta função em vez de repetir
 * `role === 'owner' || role === 'admin'`.
 */
export function canManageOrganization(role: MembershipRole): boolean {
  return hasAtLeastRole(role, 'admin');
}

export function canManageTeam(role: MembershipRole): boolean {
  return canManageOrganization(role);
}

export function canManageSecurity(role: MembershipRole): boolean {
  return canManageOrganization(role);
}

export function canDeleteOrganization(role: MembershipRole): boolean {
  return role === 'owner';
}

const MEMBERSHIP_ROLES: readonly MembershipRole[] = ['owner', 'admin', 'engineer', 'viewer'];

export function isMembershipRole(value: unknown): value is MembershipRole {
  return typeof value === 'string' && (MEMBERSHIP_ROLES as readonly string[]).includes(value);
}

/**
 * Único ponto de verdade para "quem pode mexer em qual membership".
 * `newRole = null` significa remoção. Regra (defesa em profundidade — a
 * mesma regra é imposta no banco por 0015_memberships_owner_hardening.sql):
 * - só owner/admin gerenciam equipe;
 * - admin NUNCA atribui `owner` (a outrem nem a si) e NUNCA rebaixa/remove um owner;
 * - só owner atribui `owner` ou altera/remove outro owner.
 * O último owner continua protegido à parte (guard de aplicação + trigger no banco).
 */
export function canModifyMembership(
  actorRole: MembershipRole,
  targetCurrentRole: MembershipRole,
  newRole: MembershipRole | null,
): boolean {
  if (!canManageTeam(actorRole)) return false;
  if (actorRole === 'owner') return true;
  return targetCurrentRole !== 'owner' && newRole !== 'owner';
}
