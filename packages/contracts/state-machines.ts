/**
 * Máquinas de estado. Funções PURAS: sem I/O, sem banco, sem rede.
 *
 * Uma transição não listada aqui é inválida e deve ser rejeitada,
 * registrada em policy_decisions e auditada.
 */

export type TaskState =
  | 'created' | 'ready' | 'queued' | 'leased' | 'running'
  | 'artifact_ready' | 'reviewing' | 'awaiting_checks'
  | 'awaiting_human' | 'approved' | 'completed'
  | 'changes_required' | 'failed_retryable' | 'failed_terminal'
  | 'rejected' | 'revision_required' | 'blocked'
  | 'blocked_budget' | 'cancelled' | 'superseded';

export type ActorKind = 'human' | 'agent' | 'system' | 'integration';

export interface TaskContext {
  attempt: number;
  maxAttempts: number;
  hasBlockingFindings: boolean;
  allChecksGreen: boolean;
}

interface Transition {
  from: TaskState;
  to: TaskState;
  trigger: string;
  allowedActors: readonly ActorKind[];
  guard?: (ctx: TaskContext) => boolean;
}

export const TASK_TRANSITIONS: readonly Transition[] = [
  { from: 'created',           to: 'ready',             trigger: 'dependencies_satisfied', allowedActors: ['system'] },
  { from: 'ready',             to: 'queued',            trigger: 'dispatch',               allowedActors: ['human','system'] },
  { from: 'queued',            to: 'leased',            trigger: 'lease_acquired',         allowedActors: ['system'] },
  { from: 'leased',            to: 'running',           trigger: 'adapter_started',        allowedActors: ['system'] },
  { from: 'leased',            to: 'queued',            trigger: 'lease_expired',          allowedActors: ['system'] },
  { from: 'running',           to: 'artifact_ready',    trigger: 'artifacts_validated',    allowedActors: ['system'] },
  { from: 'running',           to: 'failed_retryable',  trigger: 'transient_error',        allowedActors: ['system'] },
  { from: 'running',           to: 'failed_terminal',   trigger: 'permanent_error',        allowedActors: ['system'] },
  { from: 'running',           to: 'blocked_budget',    trigger: 'budget_exceeded',        allowedActors: ['system'] },
  { from: 'running',           to: 'cancelled',         trigger: 'cancel',                 allowedActors: ['human'] },

  { from: 'failed_retryable',  to: 'ready',             trigger: 'retry',
    allowedActors: ['system'], guard: (c) => c.attempt < c.maxAttempts },
  { from: 'failed_retryable',  to: 'failed_terminal',   trigger: 'attempts_exhausted',
    allowedActors: ['system'], guard: (c) => c.attempt >= c.maxAttempts },

  { from: 'artifact_ready',    to: 'reviewing',         trigger: 'review_cycle_opened',    allowedActors: ['system'] },
  { from: 'artifact_ready',    to: 'changes_required',  trigger: 'criteria_not_met',       allowedActors: ['system'] },

  { from: 'reviewing',         to: 'awaiting_checks',   trigger: 'cycle_concluded',        allowedActors: ['system'] },
  { from: 'reviewing',         to: 'changes_required',  trigger: 'changes_required',       allowedActors: ['system'] },
  { from: 'reviewing',         to: 'blocked',           trigger: 'blocked',                allowedActors: ['system'] },

  { from: 'changes_required',  to: 'ready',             trigger: 'repair_queued',          allowedActors: ['system'] },

  { from: 'awaiting_checks',   to: 'awaiting_human',    trigger: 'checks_green',
    allowedActors: ['system'], guard: (c) => c.allChecksGreen },
  { from: 'awaiting_checks',   to: 'changes_required',  trigger: 'checks_red',             allowedActors: ['system'] },

  // ★ Só um HUMANO aprova. Também aplicado por constraint de banco.
  { from: 'awaiting_human',    to: 'approved',          trigger: 'human_approved',
    allowedActors: ['human'], guard: (c) => !c.hasBlockingFindings },
  { from: 'awaiting_human',    to: 'rejected',          trigger: 'human_rejected',         allowedActors: ['human'] },

  { from: 'rejected',          to: 'revision_required', trigger: 'auto',                   allowedActors: ['system'] },
  { from: 'revision_required', to: 'ready',             trigger: 'new_version',            allowedActors: ['system'] },

  { from: 'approved',          to: 'completed',         trigger: 'merged',                 allowedActors: ['system'] },
  { from: 'blocked',           to: 'ready',             trigger: 'human_unblocked',        allowedActors: ['human'] },
] as const;

const TERMINAL: readonly TaskState[] = ['completed', 'failed_terminal', 'cancelled', 'superseded'];

export type TransitionResult =
  | { ok: true }
  | { ok: false; reason: string };

export function canTransition(
  from: TaskState,
  to: TaskState,
  trigger: string,
  actor: ActorKind,
  ctx: TaskContext,
): TransitionResult {
  // Cancelamento e supersessão são universais
  if (to === 'cancelled' && actor === 'human') return { ok: true };
  if (to === 'superseded' && actor === 'system') return { ok: true };

  if (TERMINAL.includes(from) && to !== 'superseded') {
    return { ok: false, reason: `Estado ${from} é terminal.` };
  }

  const match = TASK_TRANSITIONS.find(
    (t) => t.from === from && t.to === to && t.trigger === trigger,
  );

  if (!match) {
    return { ok: false, reason: `Transição não permitida: ${from} → ${to} via "${trigger}".` };
  }

  if (!match.allowedActors.includes(actor)) {
    return {
      ok: false,
      reason: `Ator "${actor}" não pode executar "${trigger}". Permitidos: ${match.allowedActors.join(', ')}.`,
    };
  }

  if (match.guard && !match.guard(ctx)) {
    return { ok: false, reason: `Guarda da transição "${trigger}" não satisfeita.` };
  }

  return { ok: true };
}

// ============================================================
// Ciclo de revisão dupla — sequência FIXA
// ============================================================

export const REVIEW_SEQUENCE = [
  { round: 1, runtime: 'openai',    phase: 'r1' },
  { round: 2, runtime: 'anthropic', phase: 'r1' },
  { round: 3, runtime: 'openai',    phase: 'r2' },
  { round: 4, runtime: 'anthropic', phase: 'r2' },
] as const;

export type NextRound =
  | { action: 'run'; round: 1 | 2 | 3 | 4; runtime: 'openai' | 'anthropic'; phase: 'r1' | 'r2' }
  | { action: 'human_gate'; reason: 'max_hops_reached' | 'cycle_concluded' };

/**
 * Decide a próxima passagem. Nenhuma heurística, nenhum julgamento de modelo.
 * ★ round > 4 é DENIED. O ciclo termina em quatro.
 */
export function nextReviewRound(currentRound: number): NextRound {
  if (currentRound >= 4 || currentRound < 0) {
    return { action: 'human_gate', reason: 'max_hops_reached' };
  }
  const step = REVIEW_SEQUENCE[currentRound];
  if (!step) {
    return { action: 'human_gate', reason: 'max_hops_reached' };
  }
  return { action: 'run', round: step.round, runtime: step.runtime, phase: step.phase };
}

/**
 * Classificação material vs. editorial de uma edição humana.
 * Determinística sobre o diff — NÃO é julgamento de modelo.
 * Em caso de dúvida, trata-se como material.
 */
const MATERIAL_PATH_PATTERNS = [
  /^supabase\/migrations\//,
  /^packages\/contracts\//,
  /^factory-intelligence\//,
  /\.sql$/,
  /schema\.json$/,
];

const MATERIAL_SECTIONS = [
  'escopo', 'critério de aceitação', 'criterios de aceitacao',
  'arquitetura', 'schema', 'migration', 'segurança', 'seguranca',
  'permissões', 'permissoes', 'dependências', 'dependencias',
  'api pública', 'api publica', 'deploy', 'ordem das etapas',
];

export function isMaterialChange(input: {
  changedPaths: string[];
  changedSections: string[];
}): boolean {
  if (input.changedPaths.some((p) => MATERIAL_PATH_PATTERNS.some((re) => re.test(p)))) {
    return true;
  }
  const normalized = input.changedSections.map((s) => s.toLowerCase());
  return normalized.some((s) => MATERIAL_SECTIONS.some((m) => s.includes(m)));
}
