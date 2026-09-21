'use client';

import { useActionState } from 'react';
import { Button } from '@rns/design-system';
import { acceptInvite } from '@/server/actions/invites';
import type { ActionState } from '@/server/actions/auth';

const initialState: ActionState = {};

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(acceptInvite, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />

      {state.error ? (
        <p role="alert" aria-live="assertive" className="text-body-sm text-status-danger">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" loading={pending} className="w-full">
        Aceitar convite
      </Button>
    </form>
  );
}
