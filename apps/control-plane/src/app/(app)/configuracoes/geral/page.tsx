import { redirect } from 'next/navigation';
import { getCurrentMembership, getOrganizationDetail } from '@/server/queries/organizations';
import { GeralForm } from './geral-form';

export default async function ConfiguracoesGeralPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect('/organizacao/nova');

  const org = await getOrganizationDetail(membership.organizationId);
  const canEdit = membership.role === 'owner' || membership.role === 'admin';

  return (
    <GeralForm
      name={org?.name ?? membership.organizationName}
      description={org?.description ?? ''}
      timezone={org?.timezone ?? 'America/Sao_Paulo'}
      canEdit={canEdit}
    />
  );
}
