'use client';

import { useActionState } from 'react';
import { Button, Input } from '@rns/design-system';
import { createOrganization } from '@/server/actions/organizations';
import type { ActionState } from '@/server/actions/auth';

const initialState: ActionState = {};

export function NovaOrganizacaoForm() {
  const [state, formAction, pending] = useActionState(createOrganization, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-lg border border-border-default bg-bg-surface p-6 shadow-sm"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-label text-text-secondary">
          Nome da organização
        </label>
        <Input id="name" name="name" autoComplete="organization" required placeholder="Minha Empresa" />
      </div>

      {state.error ? (
        <p role="alert" aria-live="assertive" className="text-body-sm text-status-danger">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" loading={pending} className="w-full">
        Criar organização
      </Button>
    </form>
  );
}
