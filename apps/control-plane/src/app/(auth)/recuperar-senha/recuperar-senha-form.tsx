'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Button, Input } from '@rns/design-system';
import { requestPasswordReset, type ActionState } from '@/server/actions/auth';

const initialState: ActionState = {};

export function RecuperarSenhaForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-lg border border-border-default bg-bg-surface p-6 shadow-sm"
    >
      <h2 className="text-h3 font-semibold text-text-primary">Recuperar senha</h2>
      <p className="text-body-sm text-text-muted">
        Informe seu e-mail. Se houver uma conta associada, enviaremos um link para redefinir a senha.
      </p>

      {state.success ? (
        <p role="status" className="rounded-md bg-status-success/10 px-3 py-2 text-body-sm text-status-success">
          Se houver uma conta com esse e-mail, o link de recuperação foi enviado.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-label text-text-secondary">
            E-mail
          </label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
      )}

      {state.error ? (
        <p role="alert" aria-live="assertive" className="text-body-sm text-status-danger">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" loading={pending} className="w-full">
        Enviar link de recuperação
      </Button>

      <p className="text-body-sm text-text-muted text-center">
        <Link href="/login" className="text-brand-primary hover:underline">
          Voltar para o login
        </Link>
      </p>
    </form>
  );
}
