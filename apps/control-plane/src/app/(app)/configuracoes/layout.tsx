'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const TABS = [
  { href: '/configuracoes/geral', label: 'Geral' },
  { href: '/configuracoes/equipe', label: 'Equipe' },
  { href: '/configuracoes/seguranca', label: 'Segurança' },
] as const;

/**
 * 09-CONFIGURACOES.md — só as três abas do checklist do Sprint 1.2.
 * Notificações/Aparência/Avançado (também [F1] na página) e Faturamento/
 * Planos ([F2]) ficam para quando o plano de sprints pedir — ver
 * sprint-1-2-status.md.
 */
export default function ConfiguracoesLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-display font-bold text-text-primary">Configurações</h1>
        <p className="text-body-lg text-text-muted">
          Personalize sua experiência, gerencie sua equipe e configure a plataforma.
        </p>
      </div>
      <nav aria-label="Abas de configurações" className="flex gap-1 border-b border-border-default">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={
                active
                  ? 'border-b-2 border-brand-primary px-4 py-2 text-body-sm font-medium text-brand-primary'
                  : 'border-b-2 border-transparent px-4 py-2 text-body-sm text-text-secondary hover:text-text-primary'
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
