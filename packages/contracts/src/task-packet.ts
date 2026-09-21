/**
 * Contratos do Task Packet.
 *
 * FONTE DE VERDADE: factory-intelligence/schemas/task-packet.schema.json
 * Este arquivo é a projeção TypeScript. Em produção ele deve ser
 * GERADO a partir do schema, não mantido à mão em paralelo.
 */

export type RoleId = 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'R7' | 'R8' | 'R9';

export type RuntimeKind =
  | 'openai'
  | 'anthropic'
  | 'antigravity'
  | 'deterministic'
  | 'mock';

export type EvidenceType =
  | 'code' | 'test' | 'ci' | 'runtime'
  | 'browser' | 'database' | 'external_source' | 'human';

export interface TaskPacketPermissions {
  filesystem: 'read_only' | 'workspace_write' | 'test_workspace';
  github: 'none' | 'read' | 'branch_write' | 'pr_review';
  supabase:
    | 'none' | 'metadata_read' | 'schema_read'
    | 'preview_read' | 'preview_read_write' | 'preview_only';
  vercel: 'none' | 'preview_read' | 'preview' | 'logs_read';
  network: 'none' | 'restricted' | 'package_registries' | 'preview_only' | 'broad';
  /** Constitucional: sempre 'deny'. Nenhum agente toca produção. */
  production: 'deny';
}

export interface TaskPacketBudget {
  /** null quando ainda não medido. NUNCA inventar um valor. */
  maxCostUsd: number | null;
  maxWallSeconds: number | null;
  /** Constitucional: no máximo 4. round > 4 é DENIED. */
  maxReviewHops: 1 | 2 | 3 | 4;
}

export interface TaskPacket {
  schemaVersion: '1.0';

  missionId: string | null;
  stageId: string | null;
  taskId: string;
  runId: string;

  role: RoleId;
  runtime: RuntimeKind;
  /** SEMPRE null no envelope. Resolvido em runtime a partir de models.yaml. */
  model: null;

  repository: string;
  /** 40 caracteres hex. Sem isto o packet é inválido. */
  baseSha: string;
  branch: string | null;

  objective: string;
  acceptanceCriteria: string[];

  allowedPaths: string[];
  /** Sempre inclui forbidden_paths_always de permissions.yaml. */
  forbiddenPaths: string[];

  requiredSkills: string[];
  requiredEvidence: EvidenceType[];
  requiredTests: string[];

  permissions: TaskPacketPermissions;
  budget: TaskPacketBudget;

  reviewPolicy: {
    sequence: Array<'openai_r1' | 'claude_r1' | 'openai_r2' | 'claude_r2'>;
    humanGateAfter: string;
  } | null;

  contextRefs: {
    priorRoundId?: string | null;
    priorArtifacts?: string[];
    specVersion?: number | null;
    planVersion?: number | null;
    previewUrl?: string | null;
  };

  expectedArtifacts: string[];
  expectedOutputSchema: string;

  intelligenceVersion: string;
  correlationId: string;
  /** Determinística. NUNCA inclui timestamp. */
  idempotencyKey: string;
}

/**
 * Deriva a chave de idempotência de uma passagem de revisão.
 * Determinística por construção: a mesma entrada produz a mesma chave,
 * de modo que uma retomada após falha não executa duas vezes.
 */
export function reviewIdempotencyKey(input: {
  taskId: string;
  phase: 'r1' | 'r2';
  round: 1 | 2 | 3 | 4;
  runtime: RuntimeKind;
  baseSha: string;
  taskPacketVersion: number;
}): string {
  return [
    'review',
    input.taskId,
    input.phase,
    String(input.round),
    input.runtime,
    input.baseSha.slice(0, 8),
    String(input.taskPacketVersion),
  ].join(':');
}

/** Caminhos proibidos em TODO Task Packet. Espelha permissions.yaml. */
export const FORBIDDEN_PATHS_ALWAYS: readonly string[] = [
  'factory-intelligence/**',
  '.github/workflows/**',
  '.github/CODEOWNERS',
  '.agents/**',
  '.claude/**',
  '.codex/**',
  'AGENTS.md',
  'CLAUDE.md',
  'scripts/intelligence/**',
  '**/.env*',
  '**/*secret*',
  '**/*credential*',
  '**/id_rsa*',
] as const;
