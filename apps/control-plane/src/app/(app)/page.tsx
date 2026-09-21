import { REVIEW_SEQUENCE, TASK_TRANSITIONS } from '@rns/state-machines';
import { getCurrentMembership } from '@/server/queries/organizations';

/**
 * Início real (dashboard com KPIs/ActivityFeed) é Sprint 1.10 — depende de
 * dados que ainda não existem (projetos, execuções). Este placeholder é
 * a primeira página dentro do shell autenticado, com a organização real.
 */
export default async function InicioPage() {
  const membership = await getCurrentMembership();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-display font-bold text-text-primary">
          Olá, {membership?.userFullName ?? membership?.userEmail}
        </h1>
        <p className="text-body-lg text-text-muted">{membership?.organizationName}</p>
      </div>
      <p className="text-body text-text-muted max-w-2xl">
        O dashboard completo (KPIs, atividade recente, projetos em destaque) chega no Sprint 1.10, depois que
        Projetos (1.5), Agentes (1.6) e Orquestração (1.12) existirem de verdade — ver{' '}
        <code className="rounded bg-bg-surface-elevated px-1 py-0.5 font-mono text-body-sm">
          docs/08-PLANO-DE-IMPLEMENTACAO/02-FASE-1-APP-FUNCIONAL.md
        </code>
        .
      </p>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-body-sm text-text-muted max-w-md">
        <dt>Transições de tarefa carregadas</dt>
        <dd className="font-mono text-text-primary">{TASK_TRANSITIONS.length}</dd>
        <dt>Passagens do ciclo de revisão</dt>
        <dd className="font-mono text-text-primary">{REVIEW_SEQUENCE.length}</dd>
      </dl>
    </div>
  );
}
