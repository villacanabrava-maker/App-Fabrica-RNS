'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentMembership } from '@/server/queries/organizations';
import { canManageTeam } from '@/server/queries/rbac';
import type { ActionState } from './auth';
import type { MembershipRole } from '../queries/organizations';

/**
 * organization_id nunca vem do formulário — sempre derivado da sessão via
 * getCurrentMembership() (03-RLS-E-DADOS.md: "organization_id nunca vem
 * do cliente"). A policy "admins update own organization" ainda barra
 * quem não é owner/admin — este check é UX antecipada, não a defesa real.
 */
export async function updateOrganizationGeneral(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: 'Sessão inválida.' };

  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const timezone = String(formData.get('timezone') ?? '').trim();

  if (!name) return { error: 'Nome da organização é obrigatório.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('organizations')
    .update({ name, description: description || null, timezone: timezone || undefined })
    .eq('id', membership.organizationId);

  if (error) {
    return { error: 'Não foi possível salvar. Verifique se você tem permissão de admin/owner.' };
  }

  revalidatePath('/configuracoes/geral');
  return { success: true };
}

/**
 * ★ Achado ao implementar: não existe constraint/trigger no banco
 * impedindo que uma organização fique sem nenhum owner (09-CONFIGURACOES.md
 * exige "não remove/rebaixa o último owner", mas nenhuma migration
 * modela isso). Diferente do gap de bootstrap de organização, este não
 * abre brecha entre tenants nem escalação de privilégio — é integridade
 * operacional (organização órfã de owner, recuperável por um admin do
 * banco). Guard aplicado aqui, na camada de aplicação, como mitigação
 * real enquanto uma constraint/trigger no banco (mais robusta) não entra
 * — registrado em sprint-1-2-status.md como dívida explícita.
 */
async function isLastOwner(organizationId: string, membershipId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('memberships')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('role', 'owner');

  const owners = data ?? [];
  return owners.length === 1 && owners[0]?.id === membershipId;
}

export async function updateMemberRole(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const membershipId = String(formData.get('membershipId') ?? '');
  const role = String(formData.get('role') ?? '') as MembershipRole;
  const current = await getCurrentMembership();
  if (!current) return { error: 'Sessão inválida.' };

  if (!canManageTeam(current.role)) {
    return { error: 'Apenas owner ou admin podem alterar papéis.' };
  }

  if (role !== 'owner' && (await isLastOwner(current.organizationId, membershipId))) {
    return { error: 'O último owner não pode ser rebaixado. Transfira a posse para outro membro antes.' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('memberships').update({ role }).eq('id', membershipId);

  if (error) {
    return { error: 'Não foi possível alterar o papel.' };
  }

  revalidatePath('/configuracoes/equipe');
  return { success: true };
}

export async function removeMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const membershipId = String(formData.get('membershipId') ?? '');
  const current = await getCurrentMembership();
  if (!current) return { error: 'Sessão inválida.' };

  if (!canManageTeam(current.role)) {
    return { error: 'Apenas owner ou admin podem remover membros.' };
  }

  if (await isLastOwner(current.organizationId, membershipId)) {
    return { error: 'O último owner não pode ser removido. Transfira a posse para outro membro antes.' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('memberships').delete().eq('id', membershipId);

  if (error) {
    return { error: 'Não foi possível remover este membro.' };
  }

  revalidatePath('/configuracoes/equipe');
  return { success: true };
}

// ★ Achado ao implementar: governance.audit_events não tem policy de
// INSERT (só "org members read audit", SELECT) — mesma classe de gap já
// encontrada em organizations/memberships (ver 0014_organization_bootstrap.sql).
// "Toda alteração gera audit_event" (09-CONFIGURACOES.md §12) fica
// pendente de uma função SECURITY DEFINER equivalente
// (governance.log_audit_event ou similar), não implementada neste sprint
// para não escrever uma segunda migration de segurança sem a mesma
// consulta ao fiscal já feita para o bootstrap de organização — ver
// sprint-1-2-status.md.
