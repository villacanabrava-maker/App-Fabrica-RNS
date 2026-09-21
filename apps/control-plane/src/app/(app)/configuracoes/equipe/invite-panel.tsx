'use client';

import { useActionState, useId } from 'react';
import { Button, Input } from '@rns/design-system';
import { inviteMember, revokeInvite, type InviteActionState } from '@/server/actions/settings';
import type { ActionState } from '@/server/actions/auth';
import type { MembershipRole } from '@/server/queries/organizations';
import type { PendingInvite } from '@/server/queries/invites';
import { canInviteRole } from '@/server/queries/rbac';

const ROLES: MembershipRole[] = ['owner', 'admin', 'engineer', 'viewer'];
const initialInviteState: InviteActionState = {};
const initialRevokeState: ActionState = {};

// UX apenas: a autorização real é recalculada no servidor (settings.ts) e no banco (factory.create_invite, 0016).
export function InvitePanel({ invites, actorRole }: { invites: PendingInvite[]; actorRole: MembershipRole }) {
  const [state, formAction, pending] = useActionState(inviteMember, initialInviteState);
  const assignableRoles = ROLES.filter((role) => canInviteRole(actorRole, role));
  const emailId = useId();
  const roleId = useId();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-h3 font-semibold text-text-primary">Convites</h2>
      </div>

      <form action={formAction} className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={emailId} className="text-label text-text-secondary">
            E-mail
          </label>
          <Input id={emailId} name="email" type="email" required placeholder="pessoa@empresa.com" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={roleId} className="text-label text-text-secondary">
            Papel
          </label>
          <select
            id={roleId}
            name="role"
            defaultValue="viewer"
            className="h-10 rounded-md border border-border-default bg-bg-surface px-2 text-body-sm text-text-primary"
          >
            {assignableRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" loading={pending}>
          Convidar
        </Button>
      </form>

      {state.error ? (
        <p role="alert" aria-live="assertive" className="text-body-sm text-status-danger">
          {state.error}
        </p>
      ) : null}
      {state.link ? (
        <p className="text-body-sm text-text-secondary">
          Convite criado. Envie este link para quem foi convidado (não há envio automático por e-mail ainda):{' '}
          <code className="break-all rounded bg-bg-surface-elevated px-1.5 py-0.5 text-caption">{state.link}</code>
        </p>
      ) : null}

      {invites.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border-default">
          <table className="w-full text-left text-body-sm">
            <thead className="bg-bg-surface-elevated text-text-secondary">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">
                  E-mail
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  Papel
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  Expira em
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => (
                <InviteRow key={invite.id} invite={invite} />
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function InviteRow({ invite }: { invite: PendingInvite }) {
  const [state, formAction, pending] = useActionState(revokeInvite, initialRevokeState);

  return (
    <tr className="border-t border-border-default">
      <td className="px-4 py-2 text-text-primary">{invite.email}</td>
      <td className="px-4 py-2 text-text-muted">{invite.role}</td>
      <td className="px-4 py-2 text-text-muted">{new Date(invite.expiresAt).toLocaleDateString('pt-BR')}</td>
      <td className="px-4 py-2 text-right">
        <form action={formAction}>
          <input type="hidden" name="inviteId" value={invite.id} />
          <Button type="submit" variant="ghost" size="sm" loading={pending}>
            Revogar
          </Button>
        </form>
        {state.error ? <p className="text-caption text-status-danger">{state.error}</p> : null}
      </td>
    </tr>
  );
}
