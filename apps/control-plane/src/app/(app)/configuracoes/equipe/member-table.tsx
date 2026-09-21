'use client';

import { useActionState } from 'react';
import { Button } from '@rns/design-system';
import { removeMember, updateMemberRole } from '@/server/actions/settings';
import type { ActionState } from '@/server/actions/auth';
import type { MembershipRole, OrganizationMember } from '@/server/queries/organizations';
import { canModifyMembership } from '@/server/queries/rbac';

const ROLES: MembershipRole[] = ['owner', 'admin', 'engineer', 'viewer'];
const initialState: ActionState = {};

// UX apenas: a autorização real é recalculada no servidor (settings.ts) e no banco (RLS + 0015).
export function MemberTable({
  members,
  currentUserId,
  canManage,
  actorRole,
}: {
  members: OrganizationMember[];
  currentUserId: string;
  canManage: boolean;
  actorRole: MembershipRole;
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
              <MemberRow
                key={member.id}
                member={member}
                canManage={canManage}
                actorRole={actorRole}
                isSelf={member.userId === currentUserId}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MemberRow({
  member,
  canManage,
  actorRole,
  isSelf,
}: {
  member: OrganizationMember;
  canManage: boolean;
  actorRole: MembershipRole;
  isSelf: boolean;
}) {
  const [roleState, roleAction, rolePending] = useActionState(updateMemberRole, initialState);
  const [removeState, removeAction, removePending] = useActionState(removeMember, initialState);
  const assignableRoles = ROLES.filter((role) => role === member.role || canModifyMembership(actorRole, member.role, role));
  const canEditRole = canManage && canModifyMembership(actorRole, member.role, member.role);
  const canRemove = canManage && !isSelf && canModifyMembership(actorRole, member.role, null);

  return (
    <tr className="border-t border-border-default">
      <td className="px-4 py-2 text-text-primary">{member.fullName ?? '—'}</td>
      <td className="px-4 py-2 text-text-muted">{member.email}</td>
      <td className="px-4 py-2">
        {canEditRole ? (
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
              {assignableRoles.map((role) => (
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
        {canRemove ? (
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
