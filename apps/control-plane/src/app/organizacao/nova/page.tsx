import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentMembership } from '@/server/queries/organizations';
import { NovaOrganizacaoForm } from './nova-organizacao-form';

export const metadata: Metadata = { title: 'Criar organização — Fábrica Apps RNS' };

/**
 * 09-CONFIGURACOES.md: "a organização precisa existir antes de qualquer
 * projeto". Fica fora do grupo (app) de propósito — o layout de (app)
 * redireciona para cá quando falta organização; se esta página vivesse
 * dentro de (app), seria um loop de redirecionamento.
 */
export default async function NovaOrganizacaoPage() {
  const membership = await getCurrentMembership();
  if (membership) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-bg-app px-4 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <div
          aria-hidden="true"
          className="flex size-10 items-center justify-center rounded-lg"
          style={{ background: 'var(--rns-brand-gradient)' }}
        />
        <h1 className="text-h2 font-bold text-text-primary">Crie sua organização</h1>
        <p className="text-body-sm text-text-muted max-w-sm">
          Toda a Fábrica Apps RNS vive dentro de uma organização — projetos, agentes e a equipe.
        </p>
      </div>
      <div className="w-full max-w-sm">
        <NovaOrganizacaoForm />
      </div>
    </div>
  );
}
