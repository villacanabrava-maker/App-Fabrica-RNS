'use client';

import { useActionState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@rns/design-system';
import { updateOrganizationGeneral } from '@/server/actions/settings';
import type { ActionState } from '@/server/actions/auth';

const initialState: ActionState = {};

export function GeralForm({
  name,
  description,
  timezone,
  canEdit,
}: {
  name: string;
  description: string;
  timezone: string;
  canEdit: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateOrganizationGeneral, initialState);

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Informações da organização</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-label text-text-secondary">
              Nome da organização
            </label>
            <Input id="name" name="name" defaultValue={name} disabled={!canEdit} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-label text-text-secondary">
              Descrição
            </label>
            <Input id="description" name="description" defaultValue={description} disabled={!canEdit} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="timezone" className="text-label text-text-secondary">
              Fuso horário
            </label>
            <Input id="timezone" name="timezone" defaultValue={timezone} disabled={!canEdit} />
          </div>

          {!canEdit ? (
            <p className="text-body-sm text-text-muted">
              Apenas owner ou admin podem editar as informações da organização.
            </p>
          ) : null}

          {state.error ? (
            <p role="alert" aria-live="assertive" className="text-body-sm text-status-danger">
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p role="status" className="text-body-sm text-status-success">
              Salvo.
            </p>
          ) : null}

          {canEdit ? (
            <Button type="submit" loading={pending} className="w-fit">
              Salvar
            </Button>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
