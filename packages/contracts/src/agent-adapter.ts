/**
 * O contrato que protege a fábrica das mudanças dos fornecedores.
 *
 * Esta interface é NOSSA. OpenAI, Anthropic e Antigravity são
 * implementações dela, não o contrato.
 *
 * Se um fornecedor mudar, troca-se o adapter.
 * O Orchestrator e o domínio NÃO mudam.
 */

import type { TaskPacket, RuntimeKind, RoleId } from './task-packet';

export type RunState =
  | 'pending' | 'running' | 'succeeded'
  | 'failed' | 'cancelled' | 'blocked';

export interface RunHandle {
  runId: string;
  runtime: RuntimeKind;
  providerSessionId: string | null;
  startedAt: string;
}

export interface RunStatus {
  runId: string;
  state: RunState;
  role: RoleId;
  round?: 1 | 2 | 3 | 4;
  progress: { summary: string } | null;
  startedAt: string | null;
  finishedAt: string | null;
}

/**
 * Evento NORMALIZADO. O navegador nunca recebe stdout bruto,
 * token de modelo ou prompt completo.
 */
export interface AgentEvent {
  runId: string;
  sequence: number;
  eventType: 'progress' | 'tool_call' | 'artifact' | 'error' | 'state_change';
  summary: string | null;
  payload: Record<string, unknown> | null;
  occurredAt: string;
}

export interface Artifact {
  type: 'plan' | 'patch' | 'review' | 'report'
      | 'screenshot' | 'log' | 'test_result' | 'diff';
  uri: string;
  /** 64 caracteres hex. Sem hash não há integridade. */
  sha256: string;
  mimeType: string | null;
  sizeBytes: number | null;
}

export interface Usage {
  inputTokens: number | null;
  cachedInputTokens: number | null;
  outputTokens: number | null;
  /** Específico de runtimes que medem por hora de sessão em execução. */
  sessionHours: number | null;
  costUsd: number | null;
  wallMs: number | null;
}

export interface AgentAdapter {
  /** Inicia uma execução a partir de um Task Packet já validado. */
  start(task: TaskPacket): Promise<RunHandle>;

  /** Retoma após um human gate, sem reexecutar o que já foi feito. */
  resume(runId: string, input: unknown): Promise<RunHandle>;

  /** Cancela uma execução em andamento. */
  cancel(runId: string): Promise<void>;

  /** Estado atual normalizado. */
  getStatus(runId: string): Promise<RunStatus>;

  /** Stream de eventos normalizados. */
  getEvents(runId: string): AsyncIterable<AgentEvent>;

  /** Artefatos produzidos, cada um com sha256. */
  getArtifacts(runId: string): Promise<Artifact[]>;

  /** Consumo real. */
  getUsage(runId: string): Promise<Usage>;
}

/**
 * Classificação de erro. Determina se houve retry técnico
 * (que NÃO consome uma passagem cognitiva) ou rejeição semântica.
 */
export type AdapterErrorKind =
  | 'transient'        // 429, 5xx, timeout de rede → retry com backoff
  | 'schema'           // saída inválida → uma tentativa corretiva
  | 'semantic'         // o revisor discordou → NÃO é retry
  | 'policy'           // violação de política → BLOCKED
  | 'budget'           // orçamento esgotado → BLOCKED_BUDGET
  | 'credential'       // credencial inválida → BLOCKED + alerta
  | 'unavailable';     // modelo indisponível → tentar próximo habilitado

export class AdapterError extends Error {
  constructor(
    public readonly kind: AdapterErrorKind,
    message: string,
    public readonly retryable: boolean,
    public readonly consumesRound: boolean,
  ) {
    super(message);
    this.name = 'AdapterError';
  }
}
