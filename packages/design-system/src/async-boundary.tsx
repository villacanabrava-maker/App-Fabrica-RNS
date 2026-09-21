import type { ReactNode } from 'react';
import { Icon } from './icon';

export type AsyncState = 'loading' | 'empty' | 'error' | 'partial' | 'success';

export interface AsyncBoundaryProps {
  state: AsyncState;
  loading: ReactNode;
  empty?: ReactNode;
  error?: ReactNode;
  /** Conteúdo parcial (mostra o que carregou, sinaliza o que falhou). Sem isso, cai em children. */
  partial?: ReactNode;
  children: ReactNode;
}

/**
 * 02-ARQUITETURA-FRONTEND.md §6 — orquestra os estados obrigatórios de UI.
 * "Stale/desatualizado" e "Forbidden" são tratados fora daqui (são estados
 * de uma tela inteira já carregada, não de um fetch em andamento) — ver
 * StalenessBanner e ForbiddenState quando essas telas existirem.
 */
export function AsyncBoundary({ state, loading, empty, error, partial, children }: AsyncBoundaryProps) {
  switch (state) {
    case 'loading':
      return <>{loading}</>;
    case 'empty':
      return <>{empty ?? loading}</>;
    case 'error':
      return <>{error ?? loading}</>;
    case 'partial':
      return <>{partial ?? children}</>;
    case 'success':
      return <>{children}</>;
  }
}

export function PartialWarning({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-md border border-status-warning/30 bg-status-warning/10 px-3 py-2 text-body-sm text-text-primary"
    >
      <Icon name="alert" size={16} className="text-status-warning" />
      <span>{message}</span>
    </div>
  );
}
