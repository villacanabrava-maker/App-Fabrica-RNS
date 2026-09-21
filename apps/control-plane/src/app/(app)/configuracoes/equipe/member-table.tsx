'use client';

import { useActionState } from 'react';
import { Button } from '@rns/design-system';
import { removeMember, updateMemberRole } from '@/server/actions/settings';
import type { ActionState } from '@/server/actions/auth';
import type { MembershipRole, OrganizationMember } from '@/server/queries/organizations';

const ROLES: MembershipRole[] = ['owner', 'admin', 'engineer', 'viewer'];
const initialState: ActionState = {};

export function MemberTable({
  members,
  currentUserId,
  canManage,
}: {
  members: OrganizationMember[];
  currentUserId: string;
  canManage: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-h3 font-semibold text-text-primary">Membros</h2>
        <Button variant="outline" disabled title="Convite por e-mail aguarda decisão de schema — ver PR #5">
          Convidar membro
        </Button>
      </div>
      <p className="text-body-sm text-text-muted">
        Convite por e-mail depende de uma migration ainda em avaliação (fila técnica na PR #5) — por ora, adicione
        membros que já têm conta diretamente pelo Supabase Auth.
      </p>

      <div className="overflow-hidden rounded-lg border border-border-default">
        <table className="w-full text-left text-body-sm">
          <thead className="bg-bg-surface-elevated text-text-secondary">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">
                Nome
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                E-mail
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                Papel
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <MemberRow key={member.id} member={member} canManage={canManage} isSelf={member.userId === currentUserId} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MemberRow({ member, canManage, isSelf }: { member: OrganizationMember; canManage: boolean; isSelf: boolean }) {
  const [roleState, roleAction, rolePending] = useActionState(updateMemberRole, initialState);
  const [removeState, removeAction, removePending] = useActionState(removeMember, initialState);

  return (
    <tr className="border-t border-border-default">
      <td className="px-4 py-2 text-text-primary">{member.fullName ?? '—'}</td>
      <td className="px-4 py-2 text-text-muted">{member.email}</td>
      <td className="px-4 py-2">
        {canManage ? (
          <form action={roleAction} className="flex items-center gap-2">
            <input type="hidden" name="membershipId" value={member.id} />
            <select
              name="role"
              defaultValue={member.role}
              disabled={rolePending}
              aria-label={`Papel de ${member.fullName ?? member.email}`}
              className="rounded-md border border-border-default bg-bg-surface px-2 py-1 text-body-sm text-text-primary"
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </form>
        ) : (
          <span className="text-text-primary">{member.role}</span>
        )}
        {roleState.error ? <p className="text-caption text-status-danger">{roleState.error}</p> : null}
      </td>
      <td className="px-4 py-2 text-right">
        {canManage && !isSelf ? (
          <form action={removeAction}>
            <input type="hidden" name="membershipId" value={member.id} />
            <Button type="submit" variant="ghost" size="sm" loading={removePending}>
              Remover
            </Button>
          </form>
        ) : null}
        {removeState.error ? <p className="text-caption text-status-danger">{removeState.error}</p> : null}
      </td>
    </tr>
  );
}
