import type { ReactNode } from 'react';

/**
 * 10-TELAS-TRANSVERSAIS.md §A.2 — cartão centralizado com marca + tagline.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-bg-app px-4 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <div
          aria-hidden="true"
          className="flex size-10 items-center justify-center rounded-lg"
          style={{ background: 'var(--rns-brand-gradient)' }}
        />
        <h1 className="text-h2 font-bold text-text-primary">Fábrica Apps RNS</h1>
        <p className="text-body-sm text-text-muted">Agentes. Ideias. Aplicativos Reais.</p>
      </div>
      <div className="w-full max-w-sm">{children}</div>
      <p className="text-body-sm text-text-muted">Transformando ideias em soluções reais com IA</p>
    </div>
  );
}
