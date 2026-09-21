import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { MembershipRole } from './organizations';

export interface PendingInvite {
  id: string;
  email: string;
  role: MembershipRole;
  status: string;
  expiresAt: string;
  createdAt: string;
}

/**
 * Lê via `factory.invites` (RLS: policy "admins read invites", só owner/admin
 * da própria organização — 0016_invites.sql). Não expõe token_hash.
 */
export async function listPendingInvites(organizationId: string): Promise<PendingInvite[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('invites')
    .select('id, email, role, status, expires_at, created_at')
    .eq('organization_id', organizationId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role as MembershipRole,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }));
}
