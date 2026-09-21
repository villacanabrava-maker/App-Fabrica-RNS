/**
 * Policy Engine — função pura, sem I/O.
 *
 * Implementa a ordem de avaliação de
 * docs/05-SEGURANCA/02-PERMISSOES-E-POLITICAS.md §5 (a primeira regra que
 * casa vence), idêntica ao comentário de cabeçalho de
 * factory-intelligence/registry/permissions.yaml:
 *
 *   1. denied_tools_always            -> DENY
 *   2. forbidden_paths_always         -> DENY
 *   3. forbidden_paths do Task Packet -> DENY
 *   4. production === deny && ação toca produção -> DENY
 *   5. ação em ask_actions            -> ASK
 *   6. permitido pelo profile         -> ALLOW
 *   7. caso contrário                 -> DENY (padrão fechado)
 */
import { matchGlob } from './glob';
import { isShellCommandAllowed } from './shell';
import type { PermissionProfile, PermissionsRegistry, PolicyRequest, PolicyResult } from './types';

/**
 * Passo 6, restrito ao que o registry especifica de forma inequívoca:
 * comandos de shell, via allow/deny do profile.
 *
 * Para outros domínios de ação (github.*, supabase.*, vercel.*, ...) o
 * registry ainda não define um catálogo de "qual ação exige qual nível de
 * acesso" — inventar essa tabela aqui violaria a convenção do próprio
 * projeto de não presumir valor não especificado. `extraCapabilityCheck`
 * é o ponto de extensão: as integrações que consomem este engine (GitHub
 * no Sprint 1.9, Supabase/Vercel no Sprint 2.6) plugam seu próprio
 * catálogo aqui. Sem ele, qualquer ação fora de shell.* cai no padrão
 * fechado do passo 7 — nunca é liberada por omissão.
 */
function isAllowedByProfile(
  request: PolicyRequest,
  profile: PermissionProfile,
  extraCapabilityCheck?: (request: PolicyRequest, profile: PermissionProfile) => boolean,
): boolean {
  if (request.action === 'shell.exec') {
    return isShellCommandAllowed(request.context.command ?? '', profile.shell);
  }
  return extraCapabilityCheck?.(request, profile) ?? false;
}

export interface EvaluatePolicyOptions {
  extraCapabilityCheck?: (request: PolicyRequest, profile: PermissionProfile) => boolean;
}

export function evaluatePolicy(
  request: PolicyRequest,
  registry: PermissionsRegistry,
  options: EvaluatePolicyOptions = {},
): PolicyResult {
  const { action, context } = request;

  // 1. denied_tools_always
  if (registry.deniedToolsAlways.includes(action)) {
    return {
      decision: 'deny',
      reason: `Ação "${action}" está em denied_tools_always. Nunca é permitida, para nenhum ator.`,
      policyRef: 'denied_tools_always',
    };
  }

  // 2. forbidden_paths_always
  if (context.targetPath) {
    const hitAlways = registry.forbiddenPathsAlways.find((p) => matchGlob(p, context.targetPath as string));
    if (hitAlways) {
      return {
        decision: 'deny',
        reason: `Caminho "${context.targetPath}" casa com forbidden_paths_always ("${hitAlways}").`,
        policyRef: 'forbidden_paths_always',
      };
    }

    // 3. forbidden_paths do Task Packet
    const hitTask = context.forbiddenPaths.find((p) => matchGlob(p, context.targetPath as string));
    if (hitTask) {
      return {
        decision: 'deny',
        reason: `Caminho "${context.targetPath}" está em forbidden_paths deste Task Packet ("${hitTask}").`,
        policyRef: 'task_packet.forbidden_paths',
      };
    }
  }

  const profile = registry.profiles[context.profile];
  if (!profile) {
    return {
      decision: 'deny',
      reason: `Profile "${context.profile}" não existe no registry. Padrão fechado.`,
      policyRef: 'unknown_profile',
    };
  }

  // 4. produção — ver PolicyContext.environment em types.ts para a extensão
  // que torna esta regra verificável.
  //
  // ★ Achado do fiscal: a primeira regra que casa VENCE. Uma exceção
  // aqui para ask_actions violava a ordem documentada, avaliando o
  // passo 5 antes do passo 4 terminar. Corrigido para DENY
  // incondicional: nenhuma ação com alvo em produção passa por este
  // profile, mesmo que o nome da ação também apareça em ask_actions.
  // Uma entrada de ask_actions só é alcançável quando o chamador NÃO
  // marcou context.environment = 'production' — a escalada humana para
  // uma ação de produção de verdade acontece por um caminho de
  // governança separado (Release Service, actor_type != 'agent'), não
  // por um agente tentando e sendo perguntado.
  if (profile.production === 'deny' && context.environment === 'production') {
    return {
      decision: 'deny',
      reason: `Ação "${action}" tem alvo em produção e o profile "${context.profile}" nunca permite produção.`,
      policyRef: 'production_deny',
    };
  }

  // 5. ask_actions
  if (registry.askActions.includes(action)) {
    return {
      decision: 'ask',
      gateReason: `Ação "${action}" está em ask_actions: exige decisão humana explícita.`,
    };
  }

  // 6. permitido pelo profile
  if (isAllowedByProfile(request, profile, options.extraCapabilityCheck)) {
    return { decision: 'allow' };
  }

  // 7. padrão fechado
  return {
    decision: 'deny',
    reason: `Ação "${action}" não está prevista no profile "${context.profile}". Padrão fechado: ação desconhecida é negada.`,
    policyRef: 'default_deny',
  };
}
