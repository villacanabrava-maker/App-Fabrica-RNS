/**
 * Carrega e resolve factory-intelligence/registry/permissions.yaml.
 *
 * Único ponto de I/O do pacote — evaluate.ts permanece puro. Resolve
 * `extends` entre profiles aqui, para que o engine nunca precise pensar
 * em herança em tempo de avaliação.
 */
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import type { PermissionProfile, PermissionsRegistry, RoleBinding, ShellPolicy } from './types';

interface RawProfile {
  extends?: string;
  filesystem?: string;
  github?: string;
  supabase?: string;
  vercel?: string;
  network?: string;
  production?: string;
  can_merge?: boolean;
  can_deploy_production?: boolean;
  shell?: { allow?: string[]; deny?: string[] };
}

interface RawRegistry {
  version: number;
  registry: string;
  profiles: Record<string, RawProfile>;
  roles: Record<string, { profile: string; exceptions?: string[] }>;
  forbidden_paths_always: string[];
  denied_tools_always: string[];
  ask_actions: string[];
}

function resolveShell(raw: RawProfile['shell']): ShellPolicy | undefined {
  if (!raw) return undefined;
  return { allow: raw.allow ?? [], deny: raw.deny ?? [] };
}

function resolveProfile(
  name: string,
  raw: Record<string, RawProfile>,
  cache: Map<string, PermissionProfile>,
  chain: string[] = [],
): PermissionProfile {
  const cached = cache.get(name);
  if (cached) return cached;

  if (chain.includes(name)) {
    throw new Error(`permissions.yaml: ciclo de "extends" detectado em profiles: ${[...chain, name].join(' -> ')}`);
  }
  const def = raw[name];
  if (!def) {
    throw new Error(`permissions.yaml: profile "${name}" referenciado mas não definido.`);
  }

  const base: Partial<PermissionProfile> = def.extends
    ? resolveProfile(def.extends, raw, cache, [...chain, name])
    : {};

  if (def.production !== undefined && def.production !== 'deny') {
    throw new Error(
      `permissions.yaml: profile "${name}" declara production="${def.production}". ` +
        `Constitucionalmente inválido — todo profile é production: deny.`,
    );
  }

  const resolved: PermissionProfile = {
    filesystem: (def.filesystem ?? base.filesystem) as PermissionProfile['filesystem'],
    github: (def.github ?? base.github) as PermissionProfile['github'],
    supabase: (def.supabase ?? base.supabase) as PermissionProfile['supabase'],
    vercel: (def.vercel ?? base.vercel) as PermissionProfile['vercel'],
    network: (def.network ?? base.network) as PermissionProfile['network'],
    production: 'deny',
    ...(def.can_merge !== undefined || base.canMerge !== undefined
      ? { canMerge: def.can_merge ?? base.canMerge }
      : {}),
    ...(def.can_deploy_production !== undefined || base.canDeployProduction !== undefined
      ? { canDeployProduction: def.can_deploy_production ?? base.canDeployProduction }
      : {}),
    ...(resolveShell(def.shell) ?? base.shell ? { shell: resolveShell(def.shell) ?? base.shell } : {}),
  };

  cache.set(name, resolved);
  return resolved;
}

export function parsePermissionsRegistry(yamlSource: string): PermissionsRegistry {
  const raw = parse(yamlSource) as RawRegistry;

  const cache = new Map<string, PermissionProfile>();
  const profiles: Record<string, PermissionProfile> = {};
  for (const name of Object.keys(raw.profiles)) {
    profiles[name] = resolveProfile(name, raw.profiles, cache);
  }

  const roles: Record<string, RoleBinding> = {};
  for (const [roleId, binding] of Object.entries(raw.roles)) {
    if (!profiles[binding.profile]) {
      throw new Error(`permissions.yaml: role "${roleId}" referencia profile inexistente "${binding.profile}".`);
    }
    roles[roleId] = {
      profile: binding.profile,
      ...(binding.exceptions !== undefined ? { exceptions: binding.exceptions } : {}),
    };
  }

  return {
    version: raw.version,
    registry: raw.registry,
    profiles,
    roles,
    forbiddenPathsAlways: raw.forbidden_paths_always,
    deniedToolsAlways: raw.denied_tools_always,
    askActions: raw.ask_actions,
  };
}

export function loadPermissionsRegistry(path: string): PermissionsRegistry {
  return parsePermissionsRegistry(readFileSync(path, 'utf-8'));
}
