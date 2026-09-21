import { redirect } from 'next/navigation';
import { getCurrentMembership, listOrganizationMembers } from '@/server/queries/organizations';
import { listPendingInvites } from '@/server/queries/invites';
import { canManageTeam } from '@/server/queries/rbac';
import { MemberTable } from './member-table';

export default async function ConfiguracoesEquipePage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect('/organizacao/nova');

  const [members, invites] = await Promise.all([
    listOrganizationMembers(membership.organizationId),
    listPendingInvites(membership.organizationId),
  ]);

  return (
    <MemberTable
      members={members}
      invites={invites}
      currentUserId={membership.userId}
      canManage={canManageTeam(membership.role)}
      actorRole={membership.role}
    />
  );
}
