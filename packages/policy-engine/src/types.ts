/**
 * Tipos do Policy Engine.
 *
 * FONTE DE VERDADE do conteúdo: factory-intelligence/registry/permissions.yaml
 * (carregado por load-registry.ts). Estes tipos são a projeção TypeScript
 * da forma desse arquivo — ver docs/05-SEGURANCA/02-PERMISSOES-E-POLITICAS.md.
 */

export type FilesystemAccess = 'read_only' | 'workspace_write' | 'test_workspace';
export type GithubAccess = 'none' | 'read' | 'branch_write' | 'pr_review';
export type SupabaseAccess =
  | 'none' | 'metadata_read' | 'schema_read'
  | 'preview_read' | 'preview_read_write' | 'preview_only';
export type VercelAccess = 'none' | 'preview_read' | 'preview' | 'logs_read';
export type NetworkAccess = 'none' | 'restricted' | 'package_registries' | 'preview_only' | 'broad';

export interface ShellPolicy {
  allow: readonly string[];
  deny: readonly string[];
}

export interface PermissionProfile {
  filesystem: FilesystemAccess;
  github: GithubAccess;
  supabase: SupabaseAccess;
  vercel: VercelAccess;
  network: NetworkAccess;
  /** Constitucional: sempre 'deny'. Nenhum profile deste registry tem outro valor. */
  production: 'deny';
  canMerge?: boolean;
  canDeployProduction?: boolean;
  shell?: ShellPolicy;
}

export interface RoleBinding {
  profile: string;
  exceptions?: readonly string[];
}

export interface PermissionsRegistry {
  version: number;
  registry: string;
  profiles: Readonly<Record<string, PermissionProfile>>;
  roles: Readonly<Record<string, RoleBinding>>;
  forbiddenPathsAlways: readonly string[];
  deniedToolsAlways: readonly string[];
  askActions: readonly string[];
}

export interface PolicyContext {
  taskPacketId: string;
  allowedPaths: readonly string[];
  forbiddenPaths: readonly string[];
  profile: string;
  targetPath?: string;
  command?: string;
  /**
   * Extensão sobre o esboço de docs/05-SEGURANCA/02-PERMISSOES-E-POLITICAS.md
   * §5: o documento fala em "ação toca produção" sem definir como isso é
   * sinalizado. Usamos o `environment_kind` que já existe no schema do banco
   * (`factory.app_environments.kind`) para tornar a regra 4 verificável.
   */
  environment?: 'preview' | 'staging' | 'production';
}

export interface PolicyRequest {
  actorType: 'agent' | 'human' | 'system';
  actorId: string;
  /** R1..R9. Ausente para actorType 'human' ou 'system'. */
  roleId?: string;
  /** Ex.: 'github.create_pr', 'shell.exec', 'supabase.migration.apply_production'. */
  action: string;
  resource: string;
  context: PolicyContext;
}

export type PolicyResult =
  | { decision: 'allow' }
  | { decision: 'ask'; gateReason: string }
  | { decision: 'deny'; reason: string; policyRef: string };
