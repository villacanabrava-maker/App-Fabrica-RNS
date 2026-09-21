import { redirect } from 'next/navigation';
import { getCurrentMembership, listOrganizationMembers } from '@/server/queries/organizations';
import { canManageTeam } from '@/server/queries/rbac';
import { MemberTable } from './member-table';

export default async function ConfiguracoesEquipePage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect('/organizacao/nova');

  const members = await listOrganizationMembers(membership.organizationId);

  return (
    <MemberTable
      members={members}
      currentUserId={membership.userId}
      canManage={canManageTeam(membership.role)}
      actorRole={membership.role}
    />
  );
}
