import { describe, expect, it } from 'vitest';
import { evaluatePolicy } from '../src/evaluate';
import type { PermissionsRegistry, PolicyRequest } from '../src/types';

const registry: PermissionsRegistry = {
  version: 1,
  registry: 'test-registry',
  profiles: {
    read_only: {
      filesystem: 'read_only',
      github: 'read',
      supabase: 'metadata_read',
      vercel: 'none',
      network: 'restricted',
      production: 'deny',
      shell: { allow: ['ls', 'cat', 'git status', 'git log'], deny: ['rm', 'sudo'] },
    },
    workspace_write: {
      filesystem: 'workspace_write',
      github: 'branch_write',
      supabase: 'preview_only',
      vercel: 'preview_read',
      network: 'package_registries',
      production: 'deny',
      shell: { allow: ['git', 'npm', 'pnpm', 'ls', 'cat'], deny: ['sudo', 'rm -rf /', 'curl * | sh'] },
    },
  },
  roles: {
    R1: { profile: 'read_only' },
    R4: { profile: 'workspace_write' },
  },
  forbiddenPathsAlways: ['factory-intelligence/**', '**/.env*', '**/*secret*'],
  deniedToolsAlways: ['github.merge', 'github.force_push', 'secret.read', 'approval.grant'],
  askActions: ['supabase.migration.apply_production', 'vercel.deployment.promote'],
};

function req(overrides: Partial<PolicyRequest> = {}): PolicyRequest {
  return {
    actorType: 'agent',
    actorId: 'run-123',
    roleId: 'R4',
    action: 'shell.exec',
    resource: 'workspace',
    context: {
      taskPacketId: 'tp-1',
      allowedPaths: ['apps/**'],
      forbiddenPaths: [],
      profile: 'workspace_write',
      command: 'git status',
    },
    ...overrides,
  };
}

describe('evaluatePolicy — passo 1: denied_tools_always', () => {
  it('nega github.merge para qualquer ator, mesmo humano', () => {
    const result = evaluatePolicy(
      req({ actorType: 'human', action: 'github.merge', context: { ...req().context, targetPath: undefined } }),
      registry,
    );
    expect(result).toMatchObject({ decision: 'deny', policyRef: 'denied_tools_always' });
  });

  // ★ Nenhum agente aprova, nem por acidente de policy mal configurada.
  it('nega approval.grant — a garantia central do sistema', () => {
    const result = evaluatePolicy(req({ action: 'approval.grant' }), registry);
    expect(result.decision).toBe('deny');
  });
});

describe('evaluatePolicy — passo 2 e 3: caminhos proibidos', () => {
  it('nega tocar factory-intelligence/** mesmo com profile workspace_write', () => {
    const result = evaluatePolicy(
      req({ action: 'fs.write', context: { ...req().context, targetPath: 'factory-intelligence/constitution/CONSTITUTION.md' } }),
      registry,
    );
    expect(result).toMatchObject({ decision: 'deny', policyRef: 'forbidden_paths_always' });
  });

  it('nega um forbidden_path específico do Task Packet mesmo fora de forbidden_paths_always', () => {
    const result = evaluatePolicy(
      req({
        action: 'fs.write',
        context: {
          ...req().context,
          targetPath: 'apps/control-plane/app/pagina-fora-de-escopo.ts',
          forbiddenPaths: ['apps/control-plane/app/pagina-fora-de-escopo.ts'],
        },
      }),
      registry,
    );
    expect(result).toMatchObject({ decision: 'deny', policyRef: 'task_packet.forbidden_paths' });
  });

  it('permite tocar um caminho fora de qualquer lista de proibição', () => {
    const result = evaluatePolicy(
      req({ action: 'shell.exec', context: { ...req().context, targetPath: 'apps/control-plane/app/page.tsx', command: 'git status' } }),
      registry,
    );
    expect(result.decision).toBe('allow');
  });
});

describe('evaluatePolicy — passo 4: produção', () => {
  it('nega ação que toca produção quando não está em ask_actions', () => {
    const result = evaluatePolicy(
      req({ action: 'vercel.production.force_deploy', context: { ...req().context, environment: 'production' } }),
      registry,
    );
    expect(result).toMatchObject({ decision: 'deny', policyRef: 'production_deny' });
  });

  it('uma ação de produção que está em ask_actions vira ASK, não DENY direto', () => {
    const result = evaluatePolicy(
      req({ action: 'vercel.deployment.promote', context: { ...req().context, environment: 'production' } }),
      registry,
    );
    expect(result.decision).toBe('ask');
  });
});

describe('evaluatePolicy — passo 5: ask_actions', () => {
  it('escalona para humano sem negar nem permitir', () => {
    const result = evaluatePolicy(req({ action: 'supabase.migration.apply_production' }), registry);
    expect(result).toMatchObject({ decision: 'ask' });
  });
});

describe('evaluatePolicy — passo 6: permitido pelo profile (shell)', () => {
  it('permite um comando que está na allowlist do profile', () => {
    const result = evaluatePolicy(req(), registry);
    expect(result.decision).toBe('allow');
  });

  it('permite qualquer subcomando de uma ferramenta liberada por inteiro (git em workspace_write)', () => {
    const result = evaluatePolicy(
      req({ context: { ...req().context, command: 'git commit -m "wip"' } }),
      registry,
    );
    expect(result.decision).toBe('allow');
  });

  it('nega um comando fora da allowlist mesmo sem estar na denylist', () => {
    const result = evaluatePolicy(req({ context: { ...req().context, command: 'psql --superuser' } }), registry);
    expect(result.decision).toBe('deny');
  });

  it('deny sempre vence, mesmo que a ferramenta esteja liberada por inteiro', () => {
    const result = evaluatePolicy(req({ context: { ...req().context, command: 'sudo rm -rf /' } }), registry);
    expect(result.decision).toBe('deny');
  });

  it('read_only nunca permite escrita, mesmo um comando git de leitura como git log', () => {
    const result = evaluatePolicy(
      req({ roleId: 'R1', context: { ...req().context, profile: 'read_only', command: 'git log' } }),
      registry,
    );
    expect(result.decision).toBe('allow');
  });

  it('read_only nega git commit, porque só liberou subcomandos específicos, não a ferramenta inteira', () => {
    const result = evaluatePolicy(
      req({ roleId: 'R1', context: { ...req().context, profile: 'read_only', command: 'git commit -m "x"' } }),
      registry,
    );
    expect(result.decision).toBe('deny');
  });
});

describe('evaluatePolicy — passo 7: padrão fechado', () => {
  it('nega uma ação desconhecida em vez de permitir por omissão', () => {
    const result = evaluatePolicy(req({ action: 'algo.que.nao.existe.no.vocabulario' }), registry);
    expect(result).toMatchObject({ decision: 'deny', policyRef: 'default_deny' });
  });

  it('nega quando o profile referenciado não existe no registry', () => {
    const result = evaluatePolicy(req({ context: { ...req().context, profile: 'profile-inventado' } }), registry);
    expect(result).toMatchObject({ decision: 'deny', policyRef: 'unknown_profile' });
  });
});

describe('evaluatePolicy — extensibilidade via extraCapabilityCheck', () => {
  it('sem extraCapabilityCheck, ações fora de shell.* caem no padrão fechado', () => {
    const result = evaluatePolicy(req({ action: 'github.create_pr' }), registry);
    expect(result.decision).toBe('deny');
  });

  it('com extraCapabilityCheck, a integração que a chama decide', () => {
    const result = evaluatePolicy(req({ action: 'github.create_pr' }), registry, {
      extraCapabilityCheck: (request) => request.action === 'github.create_pr',
    });
    expect(result.decision).toBe('allow');
  });
});
