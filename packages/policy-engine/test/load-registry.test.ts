import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { evaluatePolicy } from '../src/evaluate';
import { parsePermissionsRegistry } from '../src/load-registry';

// ★ Carrega o YAML CANÔNICO de verdade, não uma fixture — é um teste de
// drift: se alguém editar permissions.yaml de um jeito que o loader não
// entende, este teste quebra antes que o bug chegue a produção.
const REGISTRY_PATH = resolve(__dirname, '../../../factory-intelligence/registry/permissions.yaml');

describe('parsePermissionsRegistry — contra o registry canônico real', () => {
  const source = readFileSync(REGISTRY_PATH, 'utf-8');
  const registry = parsePermissionsRegistry(source);

  it('resolve todos os 9 papéis R1-R9', () => {
    for (let i = 1; i <= 9; i++) {
      expect(registry.roles[`R${i}`]).toBeDefined();
    }
  });

  it('todo profile referenciado por um papel existe e tem production: deny', () => {
    for (const binding of Object.values(registry.roles)) {
      const profile = registry.profiles[binding.profile];
      expect(profile).toBeDefined();
      expect(profile?.production).toBe('deny');
    }
  });

  it('resolve "extends" — research herda network de read_only e sobrescreve para broad', () => {
    expect(registry.profiles.research?.filesystem).toBe('read_only');
    expect(registry.profiles.research?.network).toBe('broad');
  });

  it('resolve "extends" em cadeia — test_workspace herda de workspace_write', () => {
    expect(registry.profiles.test_workspace?.filesystem).toBe('workspace_write');
    expect(registry.profiles.test_workspace?.supabase).toBe('preview_read_write');
  });

  it('approval.grant está em denied_tools_always — nenhum agente aprova, nunca', () => {
    expect(registry.deniedToolsAlways).toContain('approval.grant');
  });

  it('factory-intelligence/** está em forbidden_paths_always', () => {
    expect(registry.forbiddenPathsAlways).toContain('factory-intelligence/**');
  });

  // ★ Este é o teste que conecta o registry real ao motor real.
  it('R7 (Security & Data) com profile read_only não consegue rodar rm, mesmo em preview', () => {
    const result = evaluatePolicy(
      {
        actorType: 'agent',
        actorId: 'run-r7',
        roleId: 'R7',
        action: 'shell.exec',
        resource: 'workspace',
        context: {
          taskPacketId: 'tp-r7',
          allowedPaths: ['supabase/**'],
          forbiddenPaths: [],
          profile: registry.roles.R7?.profile ?? 'read_only',
          command: 'rm -rf supabase/migrations',
        },
      },
      registry,
    );
    expect(result.decision).toBe('deny');
  });

  it('R4 (Builder) tentando tocar factory-intelligence é negado mesmo com filesystem workspace_write', () => {
    const result = evaluatePolicy(
      {
        actorType: 'agent',
        actorId: 'run-r4',
        roleId: 'R4',
        action: 'fs.write',
        resource: 'file',
        context: {
          taskPacketId: 'tp-r4',
          allowedPaths: ['apps/**'],
          forbiddenPaths: [],
          profile: registry.roles.R4?.profile ?? 'workspace_write',
          targetPath: 'factory-intelligence/skills/code-review/SKILL.md',
        },
      },
      registry,
    );
    expect(result).toMatchObject({ decision: 'deny', policyRef: 'forbidden_paths_always' });
  });
});
