'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { siteUrl } from '@/lib/supabase/env';
import { getCurrentMembership } from '@/server/queries/organizations';
import { canInviteRole, canManageTeam, canModifyMembership, isMembershipRole } from '@/server/queries/rbac';
import type { ActionState } from './auth';
import type { MembershipRole } from '../queries/organizations';

/**
 * organization_id nunca vem do formulário — sempre derivado da sessão via
 * getCurrentMembership() (03-RLS-E-DADOS.md: "organization_id nunca vem
 * do cliente"). A autorização real é recalculada dentro de
 * factory.update_organization_general (0016_invites.sql) — este check é UX
 * antecipada, não a defesa real.
 */
export async function updateOrganizationGeneral(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: 'Sessão inválida.' };

  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const timezone = String(formData.get('timezone') ?? '').trim();

  if (!name) return { error: 'Nome da organização é obrigatório.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('update_organization_general', {
    p_organization_id: membership.organizationId,
    p_name: name,
    p_description: description || null,
    p_timezone: timezone || null,
  });

  if (error) {
    return { error: 'Não foi possível salvar. Verifique se você tem permissão de admin/owner.' };
  }

  revalidatePath('/configuracoes/geral');
  return { success: true };
}

/**
 * Guard de UX (mensagem específica antes de submeter). A defesa real contra
 * remover/rebaixar o último owner é o trigger `memberships_protect_last_owner`
 * (0015), que dispara mesmo dentro das funções SECURITY DEFINER abaixo.
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

/** Papel atual do alvo, lido no servidor e restrito à organização ativa (membershipId vem do cliente). */
async function getTargetRole(organizationId: string, membershipId: string): Promise<MembershipRole | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('memberships')
    .select('role')
    .eq('id', membershipId)
    .eq('organization_id', organizationId)
    .maybeSingle();
  return data && isMembershipRole(data.role) ? data.role : null;
}

export async function updateMemberRole(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const membershipId = String(formData.get('membershipId') ?? '');
  const rawRole = formData.get('role');
  const current = await getCurrentMembership();
  if (!current) return { error: 'Sessão inválida.' };

  if (!canManageTeam(current.role)) {
    return { error: 'Apenas owner ou admin podem alterar papéis.' };
  }

  if (!isMembershipRole(rawRole)) return { error: 'Papel inválido.' };
  const role: MembershipRole = rawRole;

  // Autorização recalculada no servidor: não confia em `canModify` da UI nem no papel vindo do formulário.
  const targetRole = await getTargetRole(current.organizationId, membershipId);
  if (!targetRole) return { error: 'Membro não encontrado nesta organização.' };
  if (!canModifyMembership(current.role, targetRole, role)) {
    return { error: 'Apenas owner pode atribuir o papel owner ou alterar/rebaixar outro owner.' };
  }

  if (role !== 'owner' && (await isLastOwner(current.organizationId, membershipId))) {
    return { error: 'O último owner não pode ser rebaixado. Transfira a posse para outro membro antes.' };
  }

  // factory.update_member_role (0016_invites.sql): mutação + audit_event na mesma transação.
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('update_member_role', { p_membership_id: membershipId, p_role: role });

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

  const targetRole = await getTargetRole(current.organizationId, membershipId);
  if (!targetRole) return { error: 'Membro não encontrado nesta organização.' };
  if (!canModifyMembership(current.role, targetRole, null)) {
    return { error: 'Apenas owner pode remover outro owner.' };
  }

  if (await isLastOwner(current.organizationId, membershipId)) {
    return { error: 'O último owner não pode ser removido. Transfira a posse para outro membro antes.' };
  }

  // factory.remove_member (0016_invites.sql): mutação + audit_event na mesma transação.
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('remove_member', { p_membership_id: membershipId });

  if (error) {
    return { error: 'Não foi possível remover este membro.' };
  }

  revalidatePath('/configuracoes/equipe');
  return { success: true };
}

export interface InviteActionState extends ActionState {
  link?: string;
}

/**
 * Chama factory.create_invite (0016_invites.sql) — o token em claro só
 * existe neste retorno (a função só persiste o hash). O link é mostrado uma
 * vez ao admin/owner para copiar e enviar; não há provedor de e-mail
 * configurado neste repositório (CLAUDE.md: não presumir integração até a
 * configuração existir).
 */
export async function inviteMember(_prev: InviteActionState, formData: FormData): Promise<InviteActionState> {
  const current = await getCurrentMembership();
  if (!current) return { error: 'Sessão inválida.' };
  if (!canManageTeam(current.role)) return { error: 'Apenas owner ou admin podem convidar membros.' };

  const email = String(formData.get('email') ?? '').trim();
  const rawRole = formData.get('role');
  if (!email) return { error: 'Informe o e-mail do convidado.' };
  if (!isMembershipRole(rawRole)) return { error: 'Papel inválido.' };
  const role: MembershipRole = rawRole;

  if (!canInviteRole(current.role, role)) {
    return { error: 'Apenas owner pode convidar com o papel owner.' };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('create_invite', {
    p_organization_id: current.organizationId,
    p_email: email,
    p_role: role,
  });

  if (error) {
    if (error.message.includes('já é membro')) return { error: 'Este e-mail já é membro da organização.' };
    if (error.message.includes('convite pendente')) return { error: 'Já existe um convite pendente para este e-mail.' };
    if (error.message.includes('e-mail inválido')) return { error: 'E-mail inválido.' };
    return { error: 'Não foi possível criar o convite.' };
  }

  const invite = (Array.isArray(data) ? data[0] : data) as { token?: string } | null;
  const link = invite?.token ? `${siteUrl()}/aceitar-convite/${invite.token}` : undefined;

  revalidatePath('/configuracoes/equipe');
  return { success: true, link };
}

export async function revokeInvite(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const current = await getCurrentMembership();
  if (!current) return { error: 'Sessão inválida.' };
  if (!canManageTeam(current.role)) return { error: 'Apenas owner ou admin podem revogar convites.' };

  const inviteId = String(formData.get('inviteId') ?? '');
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('revoke_invite', { p_invite_id: inviteId });

  if (error) {
    return { error: 'Não foi possível revogar o convite.' };
  }

  revalidatePath('/configuracoes/equipe');
  return { success: true };
}
