import { REVIEW_SEQUENCE, TASK_TRANSITIONS } from "@rns/state-machines";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-6 py-24 text-center font-sans dark:bg-black">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Fábrica Apps RNS
      </h1>
      <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
        Sprint 1.1 — fundação do monorepo. As 9 páginas do produto chegam a
        partir do Sprint 1.2, conforme{" "}
        <code className="rounded bg-black/[.06] px-1 py-0.5 font-mono text-xs dark:bg-white/[.08]">
          docs/08-PLANO-DE-IMPLEMENTACAO/02-FASE-1-APP-FUNCIONAL.md
        </code>
        .
      </p>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-left text-xs text-zinc-500 dark:text-zinc-400">
        <dt>Transições de tarefa carregadas</dt>
        <dd className="font-mono">{TASK_TRANSITIONS.length}</dd>
        <dt>Passagens do ciclo de revisão</dt>
        <dd className="font-mono">{REVIEW_SEQUENCE.length}</dd>
      </dl>
    </div>
  );
}
