'use client';

import Link from 'next/link';
import { useActionState, useId, useState } from 'react';
import { Button, Icon, Input } from '@rns/design-system';
import { signInWithGitHub, signInWithPassword, type ActionState } from '@/server/actions/auth';

const initialState: ActionState = {};

/**
 * Duas <form> irmãs (senha e GitHub), não aninhadas — HTML não permite
 * <form> dentro de <form>, e cada uma chama uma server action diferente.
 */
export function LoginForm({ next, registered }: { next: string; registered: boolean }) {
  const [state, formAction, pending] = useActionState(signInWithPassword, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const errorId = useId();

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border-default bg-bg-surface p-6 shadow-sm">
      <h2 className="text-h3 font-semibold text-text-primary">Entrar</h2>

      {registered ? (
        <p role="status" className="rounded-md bg-status-success/10 px-3 py-2 text-body-sm text-status-success">
          Conta criada. Confirme seu e-mail e entre abaixo.
        </p>
      ) : null}

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-label text-text-secondary">
            E-mail
          </label>
          <Input id="email" name="email" type="email" autoComplete="email" required aria-describedby={state.error ? errorId : undefined} />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-label text-text-secondary">
              Senha
            </label>
            <Link href="/recuperar-senha" className="text-caption text-brand-primary hover:underline">
              Esqueci a senha
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              aria-describedby={state.error ? errorId : undefined}
              className="pr-10"
            />
            <button
              type="button"
              aria-pressed={showPassword}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-text-muted hover:text-text-primary"
            >
              <Icon name={showPassword ? 'eye-off' : 'eye'} size={16} />
            </button>
          </div>
        </div>

        {state.error ? (
          <p id={errorId} role="alert" aria-live="assertive" className="text-body-sm text-status-danger">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" loading={pending} className="w-full">
          Entrar
        </Button>
      </form>

      <div className="flex items-center gap-3 text-caption text-text-muted">
        <span className="h-px flex-1 bg-border-default" />
        ou
        <span className="h-px flex-1 bg-border-default" />
      </div>

      <form action={signInWithGitHub}>
        <input type="hidden" name="next" value={next} />
        {/* Sem ícone de marca: lucide-react não inclui logos de terceiros e um
            SVG do GitHub fica para o Sprint 1.9 (ver packages/design-system/src/icon.tsx). */}
        <Button type="submit" variant="outline" className="w-full">
          Continuar com GitHub
        </Button>
      </form>

      <p className="text-body-sm text-text-muted text-center">
        Não tem conta?{' '}
        <Link href="/registrar" className="text-brand-primary hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
