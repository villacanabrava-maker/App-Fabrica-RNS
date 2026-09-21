import { createSupabaseServerClient } from '@/lib/supabase/server';

export type MembershipRole = 'owner' | 'admin' | 'engineer' | 'viewer';

export interface CurrentMembership {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: MembershipRole;
  userId: string;
  userEmail: string;
  userFullName: string | null;
}

/**
 * 09-CONFIGURACOES.md / factory.memberships (0002_identity_and_apps.sql):
 * organização ativa é sempre derivada da sessão, nunca de parâmetro do
 * cliente (03-RLS-E-DADOS.md: "organization_id nunca vem do cliente").
 *
 * MVP do Sprint 1.2: primeira membership aceita do usuário. Troca de
 * organização (múltiplas orgs por usuário) é UI de sprint futuro — RLS já
 * suporta múltiplas, esta função só não expõe seletor ainda.
 */
export async function getCurrentMembership(): Promise<CurrentMembership | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('memberships')
    .select('organization_id, role, organizations(name, slug)')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  const org = data.organizations as unknown as { name: string; slug: string } | null;
  if (!org) return null;

  return {
    organizationId: data.organization_id,
    organizationName: org.name,
    organizationSlug: org.slug,
    role: data.role as MembershipRole,
    userId: user.id,
    userEmail: user.email ?? '',
    userFullName: (user.user_metadata?.full_name as string | undefined) ?? null,
  };
}

export interface OrganizationDetail {
  id: string;
  name: string;
  description: string | null;
  timezone: string;
}

export async function getOrganizationDetail(organizationId: string): Promise<OrganizationDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, description, timezone')
    .eq('id', organizationId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  role: MembershipRole;
  acceptedAt: string | null;
  createdAt: string;
}

export async function listOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('memberships')
    .select('id, user_id, role, accepted_at, created_at, users(email, full_name)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return data.map((row) => {
    const u = row.users as unknown as { email: string; full_name: string | null } | null;
    return {
      id: row.id,
      userId: row.user_id,
      email: u?.email ?? '',
      fullName: u?.full_name ?? null,
      role: row.role as MembershipRole,
      acceptedAt: row.accepted_at,
      createdAt: row.created_at,
    };
  });
}
