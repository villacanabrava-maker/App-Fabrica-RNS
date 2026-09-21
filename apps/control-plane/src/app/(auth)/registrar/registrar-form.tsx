'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Button, Input } from '@rns/design-system';
import { signUpWithPassword, type ActionState } from '@/server/actions/auth';

const initialState: ActionState = {};

export function RegistrarForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signUpWithPassword, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-lg border border-border-default bg-bg-surface p-6 shadow-sm"
    >
      <h2 className="text-h3 font-semibold text-text-primary">Criar conta</h2>
      <input type="hidden" name="next" value={next} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="fullName" className="text-label text-text-secondary">
          Nome completo
        </label>
        <Input id="fullName" name="fullName" autoComplete="name" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-label text-text-secondary">
          E-mail
        </label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-label text-text-secondary">
          Senha
        </label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        <p className="text-caption text-text-muted">Mínimo de 8 caracteres.</p>
      </div>

      {state.error ? (
        <p role="alert" aria-live="assertive" className="text-body-sm text-status-danger">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" loading={pending} className="w-full">
        Criar conta
      </Button>

      <p className="text-body-sm text-text-muted text-center">
        Já tem conta?{' '}
        <Link
          href={next === '/' ? '/login' : `/login?next=${encodeURIComponent(next)}`}
          className="text-brand-primary hover:underline"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
